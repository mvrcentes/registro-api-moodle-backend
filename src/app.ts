import { join } from "node:path"
import AutoLoad, { type AutoloadPluginOptions } from "@fastify/autoload"
import type { FastifyPluginAsync, FastifyServerOptions } from "fastify"
import rateLimit from "@fastify/rate-limit"
import helmet from "@fastify/helmet"

import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import { env } from "./env"
import { prisma } from "./db"

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // actívalo si defines CSP
    hsts: { maxAge: 15552000 }, // 180 días
  })
  await fastify.register(rateLimit, { max: 10, timeWindow: "1 minute" })
  await fastify.register(cors, {
    origin: "http://localhost:3000",
    credentials: true,
  })
  await fastify.register(cookie, { secret: env.SESSION_SECRET })

  // Ruta ping DB
  fastify.get("/health/db", async () => {
    const count = await prisma.user.count()
    return { ok: true, users: count }
  })

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  })
}

export default app
export { app, options }
