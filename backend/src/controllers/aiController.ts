import { Request, Response } from "express";
import { executeSql, generateSql } from "../services/aiService.js";
import { prisma } from "../utils/prisma.js";
import { applyMaskingToRow, shouldMask } from "../utils/masking.js";
import { logAccess } from "../utils/accessLog.js";

async function getOwnerSensitivePolicies(ownerId: string): Promise<Record<string, { isSensitive: boolean; maskPattern?: string | null }>> {
  const cols = await prisma.datasetColumn.findMany({ where: { dataset: { ownerId }, isSensitive: true } });
  const map: Record<string, { isSensitive: boolean; maskPattern?: string | null }> = {};
  for (const c of cols) {
    if (!map[c.name]) map[c.name] = { isSensitive: true, maskPattern: c.maskPattern ?? null };
  }
  // Also include typical PII field names
  for (const key of ["cpf", "cnpj", "document", "email", "phone", "address"]) {
    map[key] ||= { isSensitive: true, maskPattern: null };
  }
  return map;
}

export async function aiQueryHandler(req: Request, res: Response) {
  try {
    const { question } = req.body as { question?: string };
    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: "Question is required" });
    }
    const sql = await generateSql(req.user!.id, question.trim());
    const rows = await executeSql(req.user!.id, sql);

    const shouldApplyMask = shouldMask(req.user!.role);
    let masked = rows;
    if (shouldApplyMask) {
      const policies = await getOwnerSensitivePolicies(req.user!.id);
      masked = rows.map((r) => applyMaskingToRow(r, policies, req.user!.role));
    }

    await logAccess(req.user!.id, "AI_QUERY", `ai`, `q=${question}`);
    return res.json({ sql, data: masked, count: masked.length });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "AI query failed" });
  }
}
