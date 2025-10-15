import OpenAI from "openai";
import { prisma } from "../utils/prisma.js";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

function sanitizeSql(sql: string): string {
  let s = sql.trim();
  // Strip code fences if present
  s = s.replace(/^```[a-zA-Z]*\n/, "").replace(/```\s*$/, "");
  // Reject dangerous statements
  const forbidden = /(insert|update|delete|drop|alter|truncate|create|grant|revoke|commit|rollback)/i;
  if (forbidden.test(s)) throw new Error("Only read-only SELECT queries are allowed");
  if (!/^select\s/i.test(s)) throw new Error("Only SELECT queries are allowed");
  // Enforce a hard limit if none present
  if (!/\blimit\b/i.test(s)) s = `${s} LIMIT 100`;
  return s;
}

export async function buildSchemaContext(ownerId: string) {
  const [datasets, relations, columns] = await Promise.all([
    prisma.dataset.findMany({ where: { ownerId } }),
    prisma.datasetRelation.findMany({ where: { OR: [{ fromDataset: { ownerId } }, { toDataset: { ownerId } }] } }),
    prisma.datasetColumn.findMany({ where: { dataset: { ownerId } } }),
  ]);
  const datasetColumns: Record<string, { name: string; isSensitive: boolean }[]> = {};
  for (const c of columns) {
    datasetColumns[c.datasetId] ||= [];
    datasetColumns[c.datasetId].push({ name: c.name, isSensitive: c.isSensitive });
  }
  const datasetsInfo = datasets.map((d) => ({
    id: d.id,
    name: d.name,
    tableName: d.tableName,
    primaryKey: d.primaryKey,
    columns: (datasetColumns[d.id] || []).map((c) => `${c.name}${c.isSensitive ? " (sensitive)" : ""}`),
  }));
  const relationsInfo = relations.map((r) => ({
    fromDatasetId: r.fromDatasetId,
    toDatasetId: r.toDatasetId,
    fromColumn: r.fromColumn,
    toColumn: r.toColumn,
    cardinality: r.cardinality,
  }));
  return { datasetsInfo, relationsInfo };
}

export async function generateSql(ownerId: string, question: string): Promise<string> {
  const { datasetsInfo, relationsInfo } = await buildSchemaContext(ownerId);
  const system = [
    "You convert natural language to SQL for PostgreSQL.",
    "Use ONLY the following tables (with exact names) and join columns when relevant.",
    "Return ONLY the SQL, no explanations. Use LIMIT 100 if none specified.",
  ].join(" ");
  const tablesDesc = datasetsInfo
    .map(
      (d) =>
        `Table ${d.tableName} (aka ${d.name}) columns: ${d.columns.join(", ")} primaryKey: ${d.primaryKey}`,
    )
    .join("\n");
  const relDesc = relationsInfo
    .map((r) => `Relation: ${r.fromDatasetId}.${r.fromColumn} -> ${r.toDatasetId}.${r.toColumn} (${r.cardinality})`)
    .join("\n");
  const userPrompt = [
    `Question: ${question}`,
    `Tables:`,
    tablesDesc || "(no tables)",
    `Relations:`,
    relDesc || "(no relations)",
    `Rules: Use only SELECT and only these tables. Prefer joins using the relations. PostgreSQL dialect.`,
  ].join("\n\n");

  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });
  const content = resp.choices[0]?.message?.content || "";
  const sql = sanitizeSql(content);
  return sql;
}

export async function executeSql(ownerId: string, sql: string) {
  // NOTE: we rely on Prisma's connection; tables are per-owner dynamic, but we trust metadata
  const rows = (await prisma.$queryRawUnsafe(sql)) as any[];
  return rows;
}
