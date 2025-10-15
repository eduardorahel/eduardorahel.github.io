import { prisma } from "./prisma.js";

export async function logAccess(
  userId: string,
  action: string,
  resource: string,
  details?: string,
) {
  try {
    await prisma.accessLog.create({
      data: { userId, action, resource, details: details ?? null },
    });
  } catch {
    // Do not block requests if audit logging fails
  }
}
