// src/modules/moodle-lms/moodle-lms.routes.ts
import type { FastifyInstance } from "fastify"
import { requireAdmin } from "../../middlewares/requireAdmin"
import * as controller from "./moodle-lms.controller"
import type {
  CreateUserBody,
  UpdateUserBody,
  DeleteUserBody,
  EnrolUserBody,
  UnenrolUserBody,
  SearchCoursesBody,
  CreateCourseBody,
  UpdateCourseBody,
  DeleteCourseBody,
} from "./moodle-lms.schema"

const routes = async (app: FastifyInstance) => {
  // ============================================================
  // RUTAS DE USUARIOS
  // ============================================================

  // Crear usuario
  app.post<{ Body: CreateUserBody }>(
    "/moodle/users",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    controller.createUserController
  )

  // Actualizar usuario
  app.put<{ Body: UpdateUserBody }>(
    "/moodle/users",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    controller.updateUserController
  )

  // Eliminar usuario
  app.delete<{ Body: DeleteUserBody }>(
    "/moodle/users",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    controller.deleteUserController
  )

  // ============================================================
  // RUTAS DE MATRICULACIÓN
  // ============================================================

  // Matricular usuario
  app.post<{ Body: EnrolUserBody }>(
    "/moodle/enrol",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    controller.enrolUserController
  )

  // Desmatricular usuario
  app.post<{ Body: UnenrolUserBody }>(
    "/moodle/unenrol",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    controller.unenrolUserController
  )

  // ============================================================
  // RUTAS DE CURSOS
  // ============================================================

  // Obtener todos los cursos
  app.get(
    "/moodle/courses",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute",
        },
      },
    },
    controller.getCoursesController
  )

  // Buscar cursos
  app.post<{ Body: SearchCoursesBody }>(
    "/moodle/courses/search",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "1 minute",
        },
      },
    },
    controller.searchCoursesController
  )

  // Crear curso
  app.post<{ Body: CreateCourseBody }>(
    "/moodle/courses",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    controller.createCourseController
  )

  // Actualizar curso
  app.put<{ Body: UpdateCourseBody }>(
    "/moodle/courses",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    controller.updateCourseController
  )

  // Eliminar curso
  app.delete<{ Body: DeleteCourseBody }>(
    "/moodle/courses",
    {
      preHandler: requireAdmin,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    controller.deleteCourseController
  )
}

export default routes
