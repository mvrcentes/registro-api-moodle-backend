import type { FastifyPluginAsync } from "fastify"
import { requireAdmin } from "../../../middlewares/requireAdmin"
import { getUsers, createAdminUser } from "./users.controller"
import type { UserRole } from "../../../generated/prisma"

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // Obtener todos los usuarios
  fastify.get("/users", { preHandler: requireAdmin }, getUsers)
  // Crear un nuevo usuario administrador
  fastify.post<{
    Body: {
      firstName: string
      lastName: string
      email: string
      password: string
      role: UserRole
    }
  }>("/users", { preHandler: requireAdmin }, createAdminUser)
}

export default usersRoutes
