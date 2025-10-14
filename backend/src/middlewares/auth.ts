import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type JwtUser = {
  id: string;
  role: "ADMIN" | "MANAGER" | "ANALYST";
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"]; 
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization header" });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }
    const payload = jwt.verify(token, secret) as JwtUser;
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRoles(...roles: JwtUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
