import type { FastifyRequest, FastifyReply } from "fastify"

export async function getHealth(_req: FastifyRequest, _res: FastifyReply) {
  return { ok: true, ts: Date.now() }
}
