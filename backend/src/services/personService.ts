import { z } from "zod";

import { prisma } from "../utils/prisma.js";
import { logAccess } from "../utils/audit.js";
import { maskValue } from "../utils/masking.js";

const personSchema = z.object({
  type: z.enum(["NATURAL", "LEGAL"]),
  name: z.string().min(2),
  document: z.string().min(5),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  customJson: z.any().optional().nullable(),
});

export async function createPerson(ownerId: string, input: unknown) {
  const data = personSchema.parse(input);
  const person = await prisma.person.create({ data: { ...data, ownerId } });
  await logAccess(ownerId, "CREATE", `person:${person.id}`);
  return person;
}

export async function listPeople(ownerId: string, role: "ADMIN" | "MANAGER" | "ANALYST") {
  const people = await prisma.person.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return people.map((p) => maskPerson(p, role));
}

export async function getPerson(ownerId: string, id: string, role: "ADMIN" | "MANAGER" | "ANALYST") {
  const p = await prisma.person.findFirst({ where: { id, ownerId } });
  if (!p) throw new Error("Not found");
  await logAccess(ownerId, "VIEW", `person:${p.id}`);
  return maskPerson(p, role);
}

export async function updatePerson(ownerId: string, id: string, input: unknown) {
  const data = personSchema.partial().parse(input);
  const p = await prisma.person.update({ where: { id }, data });
  await logAccess(ownerId, "UPDATE", `person:${p.id}`);
  return p;
}

export async function forgetPerson(ownerId: string, id: string) {
  const now = new Date();
  const p = await prisma.person.update({
    where: { id },
    data: {
      name: "REMOVIDO",
      document: "REMOVIDO",
      email: null,
      phone: null,
      address: null,
      customJson: undefined,
      deletedAt: now,
    },
  });
  await logAccess(ownerId, "FORGET", `person:${p.id}`);
  return p;
}

function shouldMask(role: "ADMIN" | "MANAGER" | "ANALYST"): boolean {
  return role === "ANALYST";
}

function maskPerson(
  p: any,
  role: "ADMIN" | "MANAGER" | "ANALYST",
): any {
  if (!shouldMask(role)) return p;
  return {
    ...p,
    document: maskValue(p.document, "XXX.XXX.XXX-XX"),
    email: p.email ? maskValue(p.email) : p.email,
    phone: p.phone ? maskValue(p.phone) : p.phone,
    address: p.address ? maskValue(p.address) : p.address,
  };
}
