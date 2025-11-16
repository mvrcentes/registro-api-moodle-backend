// src/modules/moodle-lms/moodle-lms.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify"
import {
  CreateUserSchema,
  UpdateUserSchema,
  DeleteUserSchema,
  EnrolUserSchema,
  UnenrolUserSchema,
  SearchCoursesSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
  DeleteCourseSchema,
  type CreateUserBody,
  type UpdateUserBody,
  type DeleteUserBody,
  type EnrolUserBody,
  type UnenrolUserBody,
  type SearchCoursesBody,
  type CreateCourseBody,
  type UpdateCourseBody,
  type DeleteCourseBody,
} from "./moodle-lms.schema"
import * as moodleService from "./moodle-lms.service"

// ============================================================
// CONTROLADORES DE USUARIOS
// ============================================================

export async function createUserController(
  req: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  try {
    const body = CreateUserSchema.parse(req.body)
    const result = await moodleService.createMoodleUser(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error creating Moodle user")
    return reply.code(500).send({
      ok: false,
      error: error instanceof Error ? error.message : "Error al crear usuario",
    })
  }
}

export async function updateUserController(
  req: FastifyRequest<{ Body: UpdateUserBody }>,
  reply: FastifyReply
) {
  try {
    const body = UpdateUserSchema.parse(req.body)
    const result = await moodleService.updateMoodleUser(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error updating Moodle user")
    return reply.code(500).send({
      ok: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar usuario",
    })
  }
}

export async function deleteUserController(
  req: FastifyRequest<{ Body: DeleteUserBody }>,
  reply: FastifyReply
) {
  try {
    const body = DeleteUserSchema.parse(req.body)
    const result = await moodleService.deleteMoodleUser(body.userId)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error deleting Moodle user")
    return reply.code(500).send({
      ok: false,
      error: error instanceof Error ? error.message : "Error al eliminar usuario",
    })
  }
}

// ============================================================
// CONTROLADORES DE MATRICULACIÓN
// ============================================================

export async function enrolUserController(
  req: FastifyRequest<{ Body: EnrolUserBody }>,
  reply: FastifyReply
) {
  try {
    const body = EnrolUserSchema.parse(req.body)
    const result = await moodleService.enrolUserToCourse(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error enrolling user to course")
    return reply.code(500).send({
      ok: false,
      error:
        error instanceof Error ? error.message : "Error al matricular usuario",
    })
  }
}

export async function unenrolUserController(
  req: FastifyRequest<{ Body: UnenrolUserBody }>,
  reply: FastifyReply
) {
  try {
    const body = UnenrolUserSchema.parse(req.body)
    const result = await moodleService.unenrolUserFromCourse(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error unenrolling user from course")
    return reply.code(500).send({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al desmatricular usuario",
    })
  }
}

// ============================================================
// CONTROLADORES DE CURSOS
// ============================================================

export async function getCoursesController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await moodleService.getMoodleCourses()
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error getting Moodle courses")
    return reply.code(500).send({
      ok: false,
      error: error instanceof Error ? error.message : "Error al obtener cursos",
    })
  }
}

export async function searchCoursesController(
  req: FastifyRequest<{ Body: SearchCoursesBody }>,
  reply: FastifyReply
) {
  try {
    const body = SearchCoursesSchema.parse(req.body)
    const result = await moodleService.searchMoodleCourses(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error searching Moodle courses")
    return reply.code(500).send({
      ok: false,
      error: error instanceof Error ? error.message : "Error al buscar cursos",
    })
  }
}

export async function createCourseController(
  req: FastifyRequest<{ Body: CreateCourseBody }>,
  reply: FastifyReply
) {
  try {
    const body = CreateCourseSchema.parse(req.body)
    const result = await moodleService.createMoodleCourse(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error creating Moodle course")
    return reply.code(500).send({
      ok: false,
      error: error instanceof Error ? error.message : "Error al crear curso",
    })
  }
}

export async function updateCourseController(
  req: FastifyRequest<{ Body: UpdateCourseBody }>,
  reply: FastifyReply
) {
  try {
    const body = UpdateCourseSchema.parse(req.body)
    const result = await moodleService.updateMoodleCourse(body)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error updating Moodle course")
    return reply.code(500).send({
      ok: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar curso",
    })
  }
}

export async function deleteCourseController(
  req: FastifyRequest<{ Body: DeleteCourseBody }>,
  reply: FastifyReply
) {
  try {
    const body = DeleteCourseSchema.parse(req.body)
    const result = await moodleService.deleteMoodleCourse(body.courseId)
    return reply.code(200).send({ ok: true, data: result })
  } catch (error: unknown) {
    req.log.error({ error }, "Error deleting Moodle course")
    return reply.code(500).send({
      ok: false,
      error: error instanceof Error ? error.message : "Error al eliminar curso",
    })
  }
}
