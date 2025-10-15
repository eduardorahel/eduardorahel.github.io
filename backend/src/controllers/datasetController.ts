import fs from "fs";
import path from "path";
import multer from "multer";
import { Request, Response } from "express";

import {
  createRelation,
  getDatasetData,
  getERGraph,
  importDataset,
  listDatasets,
  parsePreview,
} from "../services/datasetService.js";
import { getDatasetMaskingMap, applyMaskingToRow } from "../utils/masking.js";
import { logAccess } from "../utils/accessLog.js";

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploader = multer({ storage });

export async function previewHandler(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: "File required" });
    const preview = parsePreview(file.path);
    if (req.user) await logAccess(req.user.id, "PREVIEW", `dataset:${file.originalname}`);
    return res.json({ ...preview, filePath: file.path, originalFileName: file.originalname });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Preview failed" });
  }
}

export async function importHandler(req: Request, res: Response) {
  try {
    const { originalFileName, ...payload } = req.body;
    const dataset = await importDataset(req.user!.id, originalFileName, payload);
    if (req.user) await logAccess(req.user.id, "IMPORT", `dataset:${dataset.tableName}`);
    return res.status(201).json(dataset);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Import failed" });
  }
}

export async function listHandler(req: Request, res: Response) {
  const items = await listDatasets(req.user!.id);
  if (req.user) await logAccess(req.user.id, "LIST", `dataset:*`);
  return res.json(items);
}

export async function dataHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 25);
    const result = await getDatasetData(req.user!.id, id, page, pageSize);
    const { data, dataset, total } = result as any;
    const maskingMap = await getDatasetMaskingMap(dataset.id);
    const masked = data.map((row: any) => applyMaskingToRow(row, maskingMap, req.user!.role));
    if (req.user) await logAccess(req.user.id, "VIEW", `dataset:${dataset.tableName}`, `page=${page}&pageSize=${pageSize}`);
    return res.json({ data: masked, total });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to fetch data" });
  }
}

export async function relationHandler(req: Request, res: Response) {
  try {
    const relation = await createRelation(req.user!.id, req.body);
    if (req.user) await logAccess(req.user.id, "RELATE", `dataset-relation:${relation.fromDatasetId}->${relation.toDatasetId}`);
    return res.status(201).json(relation);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Create relation failed" });
  }
}

export async function erHandler(req: Request, res: Response) {
  const graph = await getERGraph(req.user!.id);
  if (req.user) await logAccess(req.user.id, "VIEW", `er-graph`);
  return res.json(graph);
}
