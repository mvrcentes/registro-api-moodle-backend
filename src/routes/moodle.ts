import type { FastifyInstance } from "fastify"
import moodleRoutes from "../modules/moodle/moodle.routes"

export default async function (app: FastifyInstance) {
  await app.register(moodleRoutes, { prefix: "/api/v1" })
}
