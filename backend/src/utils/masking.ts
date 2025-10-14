import { ColumnType, Prisma, Role } from "@prisma/client";

import { prisma } from "./prisma.js";

export type MaskingPolicy = {
  isSensitive: boolean;
  maskPattern?: string | null;
};

export async function getDatasetMaskingMap(datasetId: string): Promise<Record<string, MaskingPolicy>> {
  const columns = await prisma.datasetColumn.findMany({ where: { datasetId } });
  return Object.fromEntries(
    columns.map((c) => [c.name, { isSensitive: c.isSensitive, maskPattern: c.maskPattern }]),
  );
}

export function maskValue(value: unknown, pattern?: string | null): unknown {
  if (value == null) return value;
  if (typeof value !== "string") return "***";
  if (!pattern) return value.replace(/.(?=.{4})/g, "*");
  // Simple pattern tokens: X keep, * mask; we align pattern to value length when possible
  const v = value.toString();
  if (pattern.length !== v.length) {
    return v.replace(/.(?=.{4})/g, "*");
  }
  let out = "";
  for (let i = 0; i < v.length; i++) {
    out += pattern[i] === "X" ? v[i] : "*";
  }
  return out;
}

export function shouldMask(role: Role): boolean {
  return role !== "ADMIN" && role !== "MANAGER";
}

export function applyMaskingToRow(
  row: Record<string, any>,
  maskingMap: Record<string, MaskingPolicy>,
  role: Role,
): Record<string, any> {
  if (!shouldMask(role)) return row;
  const cloned: Record<string, any> = { ...row };
  for (const [key, policy] of Object.entries(maskingMap)) {
    if (!policy.isSensitive) continue;
    if (key in cloned) {
      cloned[key] = maskValue(cloned[key], policy.maskPattern);
    }
  }
  return cloned;
}
