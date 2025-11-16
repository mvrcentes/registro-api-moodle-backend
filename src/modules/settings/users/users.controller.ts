import type { FastifyRequest, FastifyReply } from "fastify"
import type { z } from "zod"
import { prisma } from "../../../db"
import type { UserRole } from "../../../generated/prisma"
import type { UsersBody } from "./users.schema"
import { hashPassword } from "../../auth/auth.service"

export interface UserOverview {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isActive?: boolean
}

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
  const users = await prisma.user.findMany({
    include: {
      solicitudes: {
        select: {
          primerNombre: true,
          primerApellido: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
        take: 1,
      },
    },
  })

  const data: UserOverview[] = users.map((user) => {
    const solicitud = user.solicitudes[0]

    const firstName = user.firstName ?? solicitud?.primerNombre ?? ""
    const lastName = user.lastName ?? solicitud?.primerApellido ?? ""

    return {
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    }
  })

  return reply.send({ ok: true, data })
}

type CreateUserRequest = FastifyRequest<{
  Body: z.infer<typeof UsersBody>
}>

export async function createAdminUser(
  req: CreateUserRequest,
  reply: FastifyReply
) {
  const { firstName, lastName, email, role, password } = req.body

  // Validación básica
  if (!firstName || !lastName || !email || !role || !password) {
    return reply.code(400).send({
      ok: false,
      error: "Faltan campos obligatorios para crear el usuario",
    })
  }

  // Solo permitir crear usuarios ADMIN desde este endpoint
  if (role !== "ADMIN") {
    return reply.code(400).send({
      ok: false,
      error: "Solo se pueden crear usuarios ADMIN desde este endpoint",
    })
  }

  // Normaliza email
  const normalizedEmail = email.trim().toLowerCase()

  try {
    // Opcional pero recomendable: verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existing) {
      return reply.code(409).send({
        ok: false,
        error: "Ya existe un usuario con ese correo",
      })
    }

    // Hash de la contraseña temporal
    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        role,
        passwordHash,
        mustResetPassword: true, // 👈 lo que querías
        isActive: true, // opcional, pero tiene sentido
      },
    })

    // Por seguridad, NO regreses la contraseña ni el hash
    const overview: UserOverview = {
      id: newUser.id,
      firstName: newUser.firstName ?? "",
      lastName: newUser.lastName ?? "",
      email: newUser.email,
      role: newUser.role,
    }

    return reply.code(201).send({ ok: true, data: overview })
  } catch (error) {
    req.log.error({ err: error }, "Error creating admin user")

    return reply.code(500).send({
      ok: false,
      error: "Error al crear el usuario",
    })
  }
}
