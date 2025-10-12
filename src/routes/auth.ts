import type { FastifyInstance } from "fastify"
import authRoutes from "../modules/auth/auth.routes"

export default async function (app: FastifyInstance) {
  await app.register(authRoutes, { prefix: "/api/v1" })
}
