import { Request, Response } from "express";

import { login, register } from "../services/authService.js";

export async function registerHandler(req: Request, res: Response) {
  try {
    const result = await register(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const result = await login(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Login failed" });
  }
}
