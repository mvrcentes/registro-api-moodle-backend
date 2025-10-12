// src/modules/auth/auth.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify"
import type { z } from "zod"
import { prisma } from "../../db"
import { LoginBody, CreateUserBody } from "./auth.schema"
import {
  createSession,
  revokeSession,
  verifyPassword,
  hashPassword,
  getSession,
} from "./auth.service"

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-sid" : "sid"
const COOKIE_SECURE = process.env.NODE_ENV === "production"

type LoginReq = FastifyRequest<{ Body: z.input<typeof LoginBody> }>
type CreateUserReq = FastifyRequest<{ Body: z.input<typeof CreateUserBody> }>

// #region admin controllers
export async function adminLogin(req: LoginReq, reply: FastifyReply) {
  const { email, password } = LoginBody.parse(req.body)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash || user.role !== "ADMIN" || !user.isActive) {
    return reply.code(401).send({ error: "BAD_CREDENTIALS" })
  }

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) return reply.code(401).send({ error: "BAD_CREDENTIALS" })

  const { token, expiresAt } = await createSession(user.id, {
    ua: req.headers["user-agent"] as string | undefined,
    ip: req.ip,
  })

  reply.setCookie(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  })

  return reply.send({ ok: true, mustResetPassword: user.mustResetPassword })
}

export async function adminLogout(req: FastifyRequest, reply: FastifyReply) {
  const sid =
    req.cookies?.[COOKIE_NAME] ??
    req.cookies?.sid ??
    req.cookies?.["__Host-sid"]
  if (sid) {
    await revokeSession(sid)
    reply.clearCookie("sid", { path: "/" })
    reply.clearCookie("__Host-sid", { path: "/" })
  }
  return reply.send({ ok: true })
}

export async function adminMe(req: FastifyRequest, reply: FastifyReply) {
  const sid =
    req.cookies?.[COOKIE_NAME] ??
    req.cookies?.sid ??
    req.cookies?.["__Host-sid"]
  if (!sid) return reply.code(401).send({ error: "UNAUTHORIZED" })

  const session = await getSession(sid)
  if (
    !session ||
    !session.user ||
    session.expiresAt < new Date() ||
    session.user.role !== "ADMIN"
  ) {
    return reply.code(401).send({ error: "UNAUTHORIZED" })
  }

  return reply.send({
    ok: true,
    user: { id: session.user.id, role: session.user.role },
  })
}

export async function adminCreateUser(req: CreateUserReq, reply: FastifyReply) {
  const body = CreateUserBody.parse(req.body)
  const passwordHash = await hashPassword(body.password)

  const user = await prisma.user.create({
    data: {
      email: body.email,
      role: body.role,
      passwordHash,
      mustResetPassword: true,
    },
    select: { id: true, role: true },
  })

  return reply.code(201).send(user)
}
// #endregion

// #region applicant controllers

// #endregion

// #region common controllers
export async function userMe(req: FastifyRequest, reply: FastifyReply) {
  const sid =
    req.cookies?.[COOKIE_NAME] ??
    req.cookies?.sid ??
    req.cookies?.["__Host-sid"]
  if (!sid) return reply.code(401).send({ error: "UNAUTHORIZED" })

  const session = await getSession(sid)
  if (!session || !session.user || session.expiresAt < new Date()) {
    return reply.code(401).send({ error: "UNAUTHORIZED" })
  }

  // Perfil mínimo apto para UI (GDPR/OWASP friendly)
  const { id, role, email, firstName, lastName } = session.user
  return reply.send({
    ok: true,
    user: {
      id,
      role, // "ADMIN" | "APPLICANT"
      email: email ?? undefined, // opcional
      name: [firstName, lastName].filter(Boolean).join(" ") || undefined, // opcional
    },
  })
}
// #endregion
