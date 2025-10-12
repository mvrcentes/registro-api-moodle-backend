// src/types/fastify.d.ts
import type { $Enums } from "../generated/prisma"

declare module "fastify" {
  interface SessionUser {
    id: string
    role: $Enums.UserRole // "ADMIN" | "APPLICANT"
  }
  interface FastifyRequest {
    currentUser?: SessionUser
  }
}
