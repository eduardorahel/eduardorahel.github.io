import { Request, Response } from "express";

import { createPerson, forgetPerson, getPerson, listPeople, updatePerson } from "../services/personService.js";

export async function createPersonHandler(req: Request, res: Response) {
  try {
    const result = await createPerson(req.user!.id, req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Create failed" });
  }
}

export async function listPeopleHandler(req: Request, res: Response) {
  try {
    const result = await listPeople(req.user!.id, req.user!.role);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "List failed" });
  }
}

export async function getPersonHandler(req: Request, res: Response) {
  try {
    const result = await getPerson(req.user!.id, req.params.id, req.user!.role);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || "Not found" });
  }
}

export async function updatePersonHandler(req: Request, res: Response) {
  try {
    const result = await updatePerson(req.user!.id, req.params.id, req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Update failed" });
  }
}

export async function forgetPersonHandler(req: Request, res: Response) {
  try {
    const result = await forgetPerson(req.user!.id, req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Forget failed" });
  }
}
