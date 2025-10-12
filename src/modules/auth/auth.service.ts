import { prisma } from "../../db"
import { verify, hash } from "@node-rs/argon2"
import { v7 as uuidv7 } from "uuid"

export async function hashPassword(plain: string) {
  return hash(plain, {
    memoryCost: 64 * 1024,
    timeCost: 3,
    outputLen: 32,
    parallelism: 1,
  })
}

export async function verifyPassword(passwordHash: string, plain: string) {
  return verify(passwordHash, plain)
}

export async function createSession(
  userId: string,
  meta: { ua?: string; ip?: string; hours?: number } = {}
) {
  const token = uuidv7()
  const hours = meta.hours ?? 8
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  await prisma.session.create({
    data: { userId, token, userAgent: meta.ua, ip: meta.ip, expiresAt },
  })
  return { token, expiresAt }
}

export async function revokeSession(token: string) {
  await prisma.session.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  })
}

export async function getSession(token: string) {
  return prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
}
