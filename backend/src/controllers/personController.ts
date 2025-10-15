import { Request, Response } from "express";

import {
  createPerson,
  deletePerson,
  erasePerson,
  listPeople,
  updatePerson,
} from "../services/personService.js";
import { applyMaskingToRow } from "../utils/masking.js";
import { logAccess } from "../utils/accessLog.js";

export async function createPersonHandler(req: Request, res: Response) {
  try {
    const person = await createPerson(req.user!.id, req.body);
    await logAccess(req.user!.id, "CREATE", `person:${person.id}`);
    return res.status(201).json(person);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Create person failed" });
  }
}

export async function listPeopleHandler(req: Request, res: Response) {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 25);
  const { items, total } = await listPeople(req.user!.id, page, pageSize);
  const masked = items.map((p) =>
    applyMaskingToRow(
      p,
      {
        document: { isSensitive: true },
        email: { isSensitive: true },
        phone: { isSensitive: true },
        address: { isSensitive: true },
      },
      req.user!.role,
    ),
  );
  await logAccess(req.user!.id, "LIST", `person:*`, `page=${page}&pageSize=${pageSize}`);
  return res.json({ data: masked, total });
}

export async function updatePersonHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const person = await updatePerson(req.user!.id, id, req.body);
    await logAccess(req.user!.id, "UPDATE", `person:${id}`);
    return res.json(person);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Update person failed" });
  }
}

export async function deletePersonHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deletePerson(req.user!.id, id);
    await logAccess(req.user!.id, "DELETE", `person:${id}`);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Delete person failed" });
  }
}

export async function erasePersonHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await erasePerson(req.user!.id, id);
    await logAccess(req.user!.id, "ERASE", `person:${id}`);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Erase person failed" });
  }
}
