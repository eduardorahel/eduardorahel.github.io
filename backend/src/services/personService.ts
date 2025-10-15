import { z } from "zod";
import { PersonType, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

const baseSchema = z.object({
  type: z.enum(["NATURAL", "LEGAL"]).describe("Person type: NATURAL or LEGAL"),
  name: z.string().min(2),
  document: z.string().min(3),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  customJson: z.any().optional().nullable(),
});

export async function createPerson(ownerId: string, input: unknown) {
  const data = baseSchema.parse(input);
  const person = await prisma.person.create({
    data: {
      ownerId,
      type: data.type as PersonType,
      name: data.name,
      document: data.document,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      customJson:
        data.customJson === undefined
          ? undefined
          : (data.customJson as any) ?? Prisma.DbNull,
    },
  });
  return person;
}

export async function listPeople(ownerId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.person.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.person.count({ where: { ownerId, deletedAt: null } }),
  ]);
  return { items, total };
}

export async function updatePerson(ownerId: string, id: string, input: unknown) {
  const schema = baseSchema.partial();
  const data = schema.parse(input);
  const existing = await prisma.person.findFirst({ where: { id, ownerId, deletedAt: null } });
  if (!existing) throw new Error("Person not found");
  const updated = await prisma.person.update({
    where: { id },
    data: {
      type: (data.type as PersonType | undefined) ?? undefined,
      name: data.name ?? undefined,
      document: data.document ?? undefined,
      email: (data.email as any) ?? undefined,
      phone: (data.phone as any) ?? undefined,
      address: (data.address as any) ?? undefined,
      customJson:
        data.customJson === undefined
          ? undefined
          : (data.customJson as any) ?? Prisma.DbNull,
    },
  });
  return updated;
}

export async function deletePerson(ownerId: string, id: string) {
  const result = await prisma.person.updateMany({
    where: { id, ownerId, deletedAt: null },
    data: {
      name: "ANONYMIZED",
      document: "",
      email: null,
      phone: null,
      address: null,
      customJson: Prisma.DbNull,
      deletedAt: new Date(),
    },
  });
  if (result.count === 0) throw new Error("Person not found");
}

export async function erasePerson(ownerId: string, id: string) {
  // Hard delete (irreversible)
  const result = await prisma.person.deleteMany({ where: { id, ownerId } });
  if (result.count === 0) throw new Error("Person not found");
}
