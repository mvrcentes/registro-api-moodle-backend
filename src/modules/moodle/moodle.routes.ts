// src/modules/moodle/moodle.routes.ts
import type { FastifyInstance } from "fastify"
import { prefillController } from "./moodle.controller"
import type { PrefillBody } from "./moodle.schema"

const routes = async (app: FastifyInstance) => {
  // Endpoint de prefill - consultar datos por DPI
  app.post<{ Body: PrefillBody }>(
    "/prefill",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    prefillController
  )
}

export default routes
