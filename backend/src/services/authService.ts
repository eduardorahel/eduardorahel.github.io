import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { z } from "zod";

import { prisma } from "../utils/prisma.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "ANALYST"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function register(input: unknown) {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role ?? "ANALYST",
    },
  });

  return signToken(user.id, user.role);
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  return signToken(user.id, user.role);
}

function signToken(id: string, role: "ADMIN" | "MANAGER" | "ANALYST") {
  const secretEnv = process.env.JWT_SECRET;
  if (!secretEnv) throw new Error("JWT secret not configured");
  const secret = secretEnv as Secret;
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN as any) ?? "1d" };
  const token = jwt.sign({ id, role }, secret, options);
  return { token, role, userId: id };
}
