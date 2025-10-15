import fs from "fs";
import path from "path";
import Papa from "papaparse";
import xlsx from "xlsx";
import { z } from "zod";

import { prisma } from "../utils/prisma.js";
import { quoteIdentifier, sanitizeIdentifier } from "../utils/sanitize.js";

const columnTypeSchema = z.enum(["STRING", "NUMBER", "BOOLEAN", "DATE", "DATETIME", "JSON"]);

const importSchema = z.object({
  name: z.string().min(1),
  primaryKey: z.string().min(1),
  columns: z.array(
    z.object({
      name: z.string().min(1),
      dataType: columnTypeSchema,
      isNullable: z.boolean().default(true),
      isUnique: z.boolean().default(false),
      isSensitive: z.boolean().default(false),
      maskPattern: z.string().optional().nullable(),
    }),
  ),
  filePath: z.string().min(1),
});

function mapTypeToPg(type: string): string {
  switch (type) {
    case "STRING":
      return "TEXT";
    case "NUMBER":
      return "NUMERIC";
    case "BOOLEAN":
      return "BOOLEAN";
    case "DATE":
      return "DATE";
    case "DATETIME":
      return "TIMESTAMP";
    case "JSON":
      return "JSONB";
    default:
      return "TEXT";
  }
}

export function parsePreview(filePath: string): { columns: string[]; rows: any[] } {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") {
    const content = fs.readFileSync(filePath, "utf8");
    const result = Papa.parse(content, { header: true, dynamicTyping: false, skipEmptyLines: true });
    const rows = Array.isArray(result.data) ? (result.data as any[]).slice(0, 50) : [];
    const columns = (result.meta.fields || []) as string[];
    return { columns, rows };
  }
  if (ext === ".xlsx" || ext === ".xls") {
    const wb = xlsx.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const json: any[] = xlsx.utils.sheet_to_json(ws, { defval: null });
    const columns = Object.keys(json[0] || {});
    return { columns, rows: json.slice(0, 50) };
  }
  throw new Error("Unsupported file type");
}

export async function importDataset(
  ownerId: string,
  originalFileName: string,
  payload: unknown,
) {
  const data = importSchema.parse(payload);
  const tableNameBase = sanitizeIdentifier(data.name);
  const tableName = `${tableNameBase}_${Date.now()}`;

  const pk = sanitizeIdentifier(data.primaryKey);
  const columnDefs = data.columns.map((c) => {
    const name = sanitizeIdentifier(c.name);
    const type = mapTypeToPg(c.dataType);
    const nullable = c.isNullable ? "" : " NOT NULL";
    return `${quoteIdentifier(name)} ${type}${nullable}`;
  });

  // Validate input file exists
  if (!fs.existsSync(data.filePath)) {
    throw new Error("Uploaded file not found");
  }

  // Create dataset metadata
  const dataset = await prisma.dataset.create({
    data: {
      ownerId,
      name: data.name,
      originalFileName,
      tableName,
      primaryKey: pk,
    },
  });

  await prisma.datasetColumn.createMany({
    data: data.columns.map((c) => ({
      datasetId: dataset.id,
      name: sanitizeIdentifier(c.name),
      dataType: c.dataType as any,
      isNullable: c.isNullable,
      isUnique: c.isUnique,
      isSensitive: c.isSensitive,
      maskPattern: c.maskPattern ?? null,
    })),
  });

  // Build and run CREATE TABLE
  const pkQuoted = quoteIdentifier(pk);
  const columnsSql = columnDefs.join(", ");
  const createSql = `CREATE TABLE ${quoteIdentifier(tableName)} (${columnsSql}, PRIMARY KEY (${pkQuoted}))`;
  await prisma.$executeRawUnsafe(createSql);

  // Load rows
  const ext = path.extname(data.filePath).toLowerCase();
  let rows: any[] = [];
  if (ext === ".csv") {
    const content = fs.readFileSync(data.filePath, "utf8");
    const result = Papa.parse(content, { header: true, dynamicTyping: false, skipEmptyLines: true });
    rows = Array.isArray(result.data) ? (result.data as any[]) : [];
  } else {
    const wb = xlsx.readFile(data.filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    rows = xlsx.utils.sheet_to_json(ws, { defval: null });
  }

  // Validate primary key in rows
  const pkSet = new Set<string>();
  for (const r of rows) {
    const key = String(r[data.primaryKey] ?? "");
    if (!key) {
      throw new Error("Primary key contains null/empty values");
    }
    if (pkSet.has(key)) {
      throw new Error("Primary key contains duplicate values");
    }
    pkSet.add(key);
  }

  // Ensure primary key column exists in import schema
  const hasPkColumn = data.columns.some((c) => sanitizeIdentifier(c.name) === pk);
  if (!hasPkColumn) {
    throw new Error("Primary key column not present in column definitions");
  }

  // Insert rows in batches
  const columnNames = data.columns.map((c) => sanitizeIdentifier(c.name));
  const quotedCols = columnNames.map((c) => quoteIdentifier(c)).join(", ");

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    if (batch.length === 0) continue;

    const values = batch
      .map((row) =>
        `(${columnNames
          .map((c) => formatValue(row[c]))
          .join(", ")})`,
      )
      .join(", ");

    const insertSql = `INSERT INTO ${quoteIdentifier(tableName)} (${quotedCols}) VALUES ${values}`;
    await prisma.$executeRawUnsafe(insertSql);
  }

  // Log import
  await prisma.importLog.create({
    data: {
      ownerId,
      fileName: originalFileName,
      tableName: tableName,
      status: "IMPORTED",
    },
  });

  return dataset;
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  // escape single quotes
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

export async function listDatasets(ownerId: string) {
  return prisma.dataset.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
}

export async function getDatasetData(
  ownerId: string,
  datasetId: string,
  page: number,
  pageSize: number,
) {
  const dataset = await prisma.dataset.findFirst({ where: { id: datasetId, ownerId } });
  if (!dataset) throw new Error("Dataset not found");
  const offset = (page - 1) * pageSize;
  const data = await prisma.$queryRawUnsafe(
    `SELECT * FROM ${quoteIdentifier(dataset.tableName)} OFFSET ${offset} LIMIT ${pageSize}`,
  );
  const countRows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int as count FROM ${quoteIdentifier(dataset.tableName)}`,
  );
  const total = Array.isArray(countRows) && countRows[0] ? (countRows[0] as any).count : 0;
  return { dataset, data, total };
}

export async function createRelation(ownerId: string, input: unknown) {
  const schema = z.object({
    fromDatasetId: z.string(),
    toDatasetId: z.string(),
    fromColumn: z.string(),
    toColumn: z.string(),
    cardinality: z.enum(["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY"]).optional(),
  });
  const data = schema.parse(input);
  const from = await prisma.dataset.findFirst({ where: { id: data.fromDatasetId, ownerId } });
  const to = await prisma.dataset.findFirst({ where: { id: data.toDatasetId, ownerId } });
  if (!from || !to) throw new Error("Datasets not found or not owned");
  return prisma.datasetRelation.create({
    data: {
      fromDatasetId: from.id,
      toDatasetId: to.id,
      fromColumn: sanitizeIdentifier(data.fromColumn),
      toColumn: sanitizeIdentifier(data.toColumn),
      cardinality: (data.cardinality as any) ?? "MANY_TO_ONE",
    },
  });
}

export async function getERGraph(ownerId: string) {
  const datasets = await prisma.dataset.findMany({ where: { ownerId } });
  const relations = await prisma.datasetRelation.findMany({
    where: { OR: [{ fromDataset: { ownerId } }, { toDataset: { ownerId } }] },
  });
  return { datasets, relations };
}
