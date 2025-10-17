// src/types/fastify.d.ts
import type { Multipart } from "@fastify/multipart"
import type { $Enums } from "../generated/prisma"

declare module "fastify" {
  interface SessionUser {
    id: string
    role: $Enums.UserRole // "ADMIN" | "APPLICANT"
  }
  interface FastifyRequest {
    currentUser?: SessionUser
    /**
     * Provided by @fastify/multipart when the request is multipart/form-data.
     */
    parts: () => AsyncIterableIterator<Multipart>
    isMultipart(): boolean
  }
}
