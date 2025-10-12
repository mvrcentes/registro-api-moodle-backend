import type { FastifyPluginAsync } from "fastify"
import healthRoutes from "../modules/health/health.routes"

const routes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes, { prefix: "/api/v1" })
}

export default routes
