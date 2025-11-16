// src/env.ts (robusto para postgres:// o postgresql:// y sin depender de interpolación)
import "dotenv/config"
import { z } from "zod"

// Construye la URL si no existe explícita, usando variables por partes
const buildPgUrlFromParts = (env: NodeJS.ProcessEnv) => {
  const user = env.POSTGRES_USER
  const pass = env.POSTGRES_PASSWORD
  const host = env.DB_HOST ?? env.DB_HOSTNAME ?? "localhost"
  const port = env.DB_PORT ?? "5432"
  const db = env.POSTGRES_DB ?? env.DB_NAME
  if (user && pass && host && port && db) {
    return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`
  }
  return undefined
}

// Validador permisivo con "escape hatch": si SKIP_DATABASE_URL_CHECK=1, salta validación
const PostgresUrlSchema = z
  .string()
  .trim()
  .refine((v) => {
    if (process.env.SKIP_DATABASE_URL_CHECK === "1") return true
    return /^postgres(ql)?:\/\//i.test(v)
  }, { message: "DATABASE_URL must start with postgres:// or postgresql://" })
  .refine((v) => {
    if (process.env.SKIP_DATABASE_URL_CHECK === "1") return true
    // Validación básica por regex (no dependencia de WHATWG URL)
    // postgres[ql]://user:pass@host:port/db?schema=public
    return /^postgres(ql)?:\/\/[\w!#$%&'*+\-./:=?^_`{|}~]+@[^\/\s:]+(?::\d+)?\/[A-Za-z0-9_\-]+(\?[^\s]*)?$/i.test(v)
  }, { message: "DATABASE_URL must be a valid Postgres connection URL" })

// 1) Parse preliminar (sin URL final aún)
const BaseEnv = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 chars"),
  DATABASE_URL: z.string().optional(),
  // API Externa de Prefill (CGC)
  PREFILL_API_URL: z.string().url("PREFILL_API_URL must be a valid URL"),
  BASE_API_USER: z.string().min(1, "BASE_API_USER is required"),
  BASE_API_PASSWORD: z.string().min(1, "BASE_API_PASSWORD is required"),
  // API de Moodle
  MOODLE_SIGNUP_API_URL: z.string().url("MOODLE_SIGNUP_API_URL must be a valid URL"),
  MOODLE_SIGNUP_API_TOKEN: z.string().min(1, "MOODLE_SIGNUP_API_TOKEN is required"),
})

const base = BaseEnv.parse(process.env)

// 2) Determinar la URL final
const finalDatabaseUrl =
  (process.env.DATABASE_URL ?? "").trim() || buildPgUrlFromParts(process.env)

if (!finalDatabaseUrl) {
  throw new Error(
    "DATABASE_URL not set and could not be built from POSTGRES_* vars. Set DATABASE_URL in .env"
  )
}

// 3) Validar ahora con el esquema tolerante
const FinalEnv = BaseEnv.extend({
  DATABASE_URL: PostgresUrlSchema,
})

export const env = FinalEnv.parse({
  ...process.env,
  DATABASE_URL: finalDatabaseUrl,
})
