import type { FastifyInstance } from "fastify"
import moodleLmsRoutes from "../modules/moodle-lms/moodle-lms.routes"

export default async function (app: FastifyInstance) {
  await app.register(moodleLmsRoutes, { prefix: "/api/v1" })
}
