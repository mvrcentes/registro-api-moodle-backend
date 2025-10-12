import app, { options } from "./app"
import { env } from "./env"
import Fastify from "fastify"

const start = async () => {
  const fastify = Fastify({ logger: true })
  await fastify.register(app, options)
  await fastify.listen({ host: "0.0.0.0", port: env.PORT })
  fastify.log.info(`🚀 API http://localhost:${env.PORT}`)
}

start()
