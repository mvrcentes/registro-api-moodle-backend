// src/modules/moodle-lms/moodle-lms.service.ts
import axios from "axios"
import https from "node:https"
import { env } from "../../env"

// Ignorar verificación SSL (el servidor de Moodle tiene certificado no verificable)
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

/**
 * Cliente axios para la API de Moodle LMS
 */
const moodleApiClient = axios.create({
  baseURL: env.MOODLE_SIGNUP_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  httpsAgent,
})

/**
 * Función auxiliar para hacer peticiones a Moodle
 */
async function callMoodleFunction(
  wsfunction: string,
  params: Record<string, unknown> = {}
) {
  const response = await moodleApiClient.post("", null, {
    params: {
      wstoken: env.MOODLE_SIGNUP_API_TOKEN,
      wsfunction,
      moodlewsrestformat: "json",
      ...params,
    },
  })

  return response.data
}

// ============================================================
// OPERACIONES DE USUARIOS
// ============================================================

/**
 * Datos del perfil personalizado para Moodle
 */
export interface MoodleProfileData {
  dpi: string
  nit?: string
  sexo: string
  edad: number
  departamento: string
  municipio: string
  etnia: string
  telefono?: string
  sector?: string
  institucion?: string
  dependencia?: string
  renglon?: string
  colegio?: string
  colegiadoNo?: string
}

/**
 * Crear usuario en Moodle
 * Moodle genera la contraseña automáticamente y envía email de bienvenida
 */
export async function createMoodleUser(userData: {
  username: string
  firstname: string
  lastname: string
  email: string
  profile?: MoodleProfileData
}) {
  const params: Record<string, unknown> = {
    "users[0][username]": userData.username,
    "users[0][firstname]": userData.firstname,
    "users[0][lastname]": userData.lastname,
    "users[0][email]": userData.email,
    "users[0][createpassword]": 1,
  }

  // Agregar campos personalizados del perfil con los shortnames de Moodle
  if (userData.profile) {
    let i = 0
    const p = userData.profile

    const add = (shortname: string, value: string | number | undefined | null) => {
      if (value !== undefined && value !== null && value !== "") {
        params[`users[0][customfields][${i}][type]`] = shortname
        params[`users[0][customfields][${i}][value]`] = String(value)
        i++
      }
    }

    add("DPI", p.dpi)
    add("NIT", p.nit)
    add("SEXO", p.sexo)
    add("edad", p.edad)
    add("DP", p.departamento)
    add("MR", p.municipio)
    add("ET", p.etnia)
    add("CELULAR", p.telefono)
    add("SECTOR", p.sector)
    add("LABORES", p.institucion)
    add("cgccampos", p.dependencia)
    add("reglon", p.renglon)
    add("colegio", p.colegio)
    add("colegiado", p.colegiadoNo)
  }

  return callMoodleFunction("core_user_create_users", params)
}

/**
 * Actualizar usuario en Moodle
 */
export async function updateMoodleUser(userData: {
  id: number
  username?: string
  firstname?: string
  lastname?: string
  email?: string
}) {
  const params: Record<string, unknown> = {
    "users[0][id]": userData.id,
  }

  if (userData.username) params["users[0][username]"] = userData.username
  if (userData.firstname) params["users[0][firstname]"] = userData.firstname
  if (userData.lastname) params["users[0][lastname]"] = userData.lastname
  if (userData.email) params["users[0][email]"] = userData.email

  return callMoodleFunction("core_user_update_users", params)
}

/**
 * Eliminar usuario en Moodle
 */
export async function deleteMoodleUser(userId: number) {
  return callMoodleFunction("core_user_delete_users", {
    "userids[0]": userId,
  })
}

// ============================================================
// OPERACIONES DE MATRICULACIÓN
// ============================================================

/**
 * Matricular usuario en un curso
 */
export async function enrolUserToCourse(data: {
  userId: number
  courseId: number
  roleId?: number
}) {
  return callMoodleFunction("enrol_manual_enrol_users", {
    "enrolments[0][userid]": data.userId,
    "enrolments[0][courseid]": data.courseId,
    "enrolments[0][roleid]": data.roleId || 5, // 5 = estudiante por defecto
  })
}

/**
 * Desmatricular usuario de un curso
 */
export async function unenrolUserFromCourse(data: {
  userId: number
  courseId: number
}) {
  return callMoodleFunction("enrol_manual_unenrol_users", {
    "enrolments[0][userid]": data.userId,
    "enrolments[0][courseid]": data.courseId,
  })
}

// ============================================================
// OPERACIONES DE CURSOS
// ============================================================

/**
 * Obtener cursos disponibles
 */
export async function getMoodleCourses() {
  return callMoodleFunction("core_course_get_courses")
}

/**
 * Buscar cursos por campo
 */
export async function searchMoodleCourses(data: {
  criterianame: string
  criteriavalue: string
}) {
  return callMoodleFunction("core_course_search_courses", {
    criterianame: data.criterianame,
    criteriavalue: data.criteriavalue,
  })
}

/**
 * Crear curso (admin)
 */
export async function createMoodleCourse(courseData: {
  fullname: string
  shortname: string
  categoryid: number
  summary?: string
}) {
  return callMoodleFunction("core_course_create_courses", {
    "courses[0][fullname]": courseData.fullname,
    "courses[0][shortname]": courseData.shortname,
    "courses[0][categoryid]": courseData.categoryid,
    "courses[0][summary]": courseData.summary || "",
  })
}

/**
 * Actualizar curso (admin)
 */
export async function updateMoodleCourse(courseData: {
  id: number
  fullname?: string
  shortname?: string
  summary?: string
}) {
  const params: Record<string, unknown> = {
    "courses[0][id]": courseData.id,
  }

  if (courseData.fullname) params["courses[0][fullname]"] = courseData.fullname
  if (courseData.shortname)
    params["courses[0][shortname]"] = courseData.shortname
  if (courseData.summary) params["courses[0][summary]"] = courseData.summary

  return callMoodleFunction("core_course_update_courses", params)
}

/**
 * Eliminar curso (admin)
 */
export async function deleteMoodleCourse(courseId: number) {
  return callMoodleFunction("core_course_delete_courses", {
    "courseids[0]": courseId,
  })
}
