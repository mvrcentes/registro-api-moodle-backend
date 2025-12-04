// src/modules/moodle/moodle.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify"
import { PrefillBodySchema, type PrefillBody } from "./moodle.schema"
import { getUserByDpi } from "./moodle.service"
import axios from "axios"

type PrefillRequest = FastifyRequest<{ Body: PrefillBody }>

/**
 * Controlador para prefill de datos por DPI
 * Consulta la API externa y mapea los datos al formato esperado
 */
export async function prefillController(req: PrefillRequest, reply: FastifyReply) {
  console.log("[Prefill Controller] Request received")
  console.log("[Prefill Controller] Request body:", JSON.stringify(req.body, null, 2))

  try {
    const { dpi } = PrefillBodySchema.parse(req.body)
    console.log("[Prefill Controller] Parsed DPI:", dpi)

    // Consultar datos del usuario en la API externa (usando el service)
    console.log("[Prefill Controller] Calling getUserByDpi...")
    const response = await getUserByDpi(dpi)
    console.log("[Prefill Controller] getUserByDpi returned:", typeof response)
    console.log("[Prefill Controller] Response structure:", JSON.stringify(response, null, 2))

    // Validar estructura de respuesta - soportar múltiples formatos
    const respData = response as { list?: Array<Record<string, unknown>>; data?: Record<string, unknown> | Array<Record<string, unknown>> }

    // Extraer datos del usuario de diferentes estructuras posibles
    let userData: Record<string, unknown> | null = null

    if (respData?.list && Array.isArray(respData.list) && respData.list.length > 0) {
      // Formato: { list: [...] }
      userData = respData.list[0]
      console.log("[Prefill Controller] Found data in list[0]")
    } else if (respData?.data && Array.isArray(respData.data) && respData.data.length > 0) {
      // Formato: { data: [...] }
      userData = respData.data[0]
      console.log("[Prefill Controller] Found data in data[0]")
    } else if (respData?.data && !Array.isArray(respData.data) && typeof respData.data === 'object') {
      // Formato: { data: {...} }
      userData = respData.data as Record<string, unknown>
      console.log("[Prefill Controller] Found data in data object")
    } else if (response && typeof response === 'object' && !Array.isArray(response) && !('list' in (response as object)) && !('data' in (response as object))) {
      // Formato: directamente el objeto de usuario { dpi, primerNombre, ... }
      const directData = response as Record<string, unknown>
      if (directData.dpi || directData.primerNombre || directData.primer_nombre) {
        userData = directData
        console.log("[Prefill Controller] Found data as direct object")
      }
    }

    if (userData) {
      // Mapear el país correctamente
      let paisValue = (userData.pais as string) || (userData.country as string) || "Guatemala"
      if (paisValue === "GUATEMALA") {
        paisValue = "Guatemala"
      }

      return reply.code(200).send({
        success: true,
        data: {
          dpi: (userData.dpi as string) || dpi,
          primerNombre:
            (userData.primerNombre as string) ||
            (userData.primer_nombre as string) ||
            (userData.firstName as string) ||
            "",
          segundoNombre:
            (userData.segundoNombre as string) ||
            (userData.segundo_nombre as string) ||
            (userData.secondName as string) ||
            "",
          primerApellido:
            (userData.primerApellido as string) ||
            (userData.primer_apellido as string) ||
            (userData.lastName as string) ||
            "",
          segundoApellido:
            (userData.segundoApellido as string) ||
            (userData.segundo_apellido as string) ||
            (userData.secondLastName as string) ||
            "",
          email:
            (userData.correoPersonal as string) ||
            (userData.email as string) ||
            (userData.correo as string) ||
            "",
          correoInstitucional:
            (userData.correoInstitucional as string) ||
            (userData.correo_institucional as string) ||
            "",
          correoPersonal:
            (userData.correoPersonal as string) ||
            (userData.correo_personal as string) ||
            (userData.email as string) ||
            (userData.correo as string) ||
            "",
          fechaNacimiento:
            (userData.fechaNacimiento as string) ||
            (userData.fecha_nacimiento as string) ||
            (userData.birthDate as string) ||
            "",
          sexo: (userData.sexo as string) || (userData.genero as string) || (userData.gender as string) || "",
          pais: paisValue,
          departamento: (userData.departamento as string) || (userData.department as string) || "",
          municipio: (userData.municipio as string) || (userData.municipality as string) || "",
          nit: (userData.nit as string) || "",
          telefono: (userData.telefono as string) || (userData.phone as string) || "",
          entidad: (userData.entidad as string) || (userData.entity as string) || "",
          institucion:
            (userData.institucion as string) ||
            (userData.entidad as string) ||
            (userData.entity as string) ||
            "",
          dependencia: (userData.dependencia as string) || (userData.dependency as string) || "",
          renglon: (userData.renglon as string) || (userData.budget_line as string) || "",
          profesion: (userData.profesion as string) || (userData.profession as string) || "",
          puesto: (userData.puesto as string) || (userData.position as string) || "",
          sector: (userData.sector as string) || (userData.sector_laboral as string) || "",
          colegio: (userData.colegio as string) || (userData.college as string) || "",
          numeroColegiado:
            (userData.numeroColegiado as string) ||
            (userData.numero_colegiado as string) ||
            (userData.professional_number as string) ||
            "",
          message: "Datos encontrados",
        },
      })
    }

    // Si no hay datos del usuario (lista vacía o respuesta sin datos)
    console.log("[Prefill Controller] No user data found, returning empty response")
    return reply.code(200).send({
      success: true,
      data: {
        dpi,
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        email: "",
        correoInstitucional: "",
        correoPersonal: "",
        fechaNacimiento: "",
        sexo: "",
        pais: "Guatemala",
        departamento: "",
        municipio: "",
        nit: "",
        telefono: "",
        entidad: "",
        institucion: "",
        dependencia: "",
        renglon: "",
        profesion: "",
        puesto: "",
        sector: "",
        colegio: "",
        numeroColegiado: "",
        message: "DPI no registrado en la base de datos de la CGC",
      },
    })
  } catch (error: unknown) {
    console.log("[Prefill Controller] CATCH block - Error occurred")
    if (error instanceof Error) {
      console.log("[Prefill Controller] Error name:", error.name)
      console.log("[Prefill Controller] Error message:", error.message)
      console.log("[Prefill Controller] Error stack:", error.stack)
    }
    req.log.error({ error }, "Prefill error")

    // Manejar error 404 (DPI no encontrado)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const { dpi } = req.body
      return reply.code(200).send({
        success: true,
        data: {
          dpi,
          primerNombre: "",
          segundoNombre: "",
          primerApellido: "",
          segundoApellido: "",
          email: "",
          correoInstitucional: "",
          correoPersonal: "",
          fechaNacimiento: "",
          sexo: "",
          pais: "Guatemala",
          departamento: "",
          municipio: "",
          nit: "",
          telefono: "",
          entidad: "",
          institucion: "",
          dependencia: "",
          renglon: "",
          profesion: "",
          puesto: "",
          sector: "",
          colegio: "",
          numeroColegiado: "",
          message: "DPI no registrado en la base de datos de la CGC",
        },
      })
    }

    // Otros errores con mensajes descriptivos
    let status = 500
    let message = "Error al consultar DPI"
    let errorStr = "API Error"
    let errorType = "UNKNOWN_ERROR"

    if (axios.isAxiosError(error)) {
      status = error.response?.status ?? 500

      // Mensajes específicos según el código de error
      switch (status) {
        case 401:
          message = "Error de autenticación con el servicio externo. Contacte al administrador."
          errorStr = "Authentication Error"
          errorType = "AUTH_ERROR"
          break
        case 403:
          message = "Acceso denegado al servicio externo. Su IP podría no estar autorizada."
          errorStr = "Access Denied"
          errorType = "ACCESS_DENIED"
          break
        case 408:
        case 504:
          message = "El servicio externo no respondió a tiempo. Intente nuevamente."
          errorStr = "Timeout"
          errorType = "TIMEOUT"
          break
        case 500:
        case 502:
        case 503:
          message = "El servicio externo no está disponible. Intente más tarde."
          errorStr = "Service Unavailable"
          errorType = "SERVICE_UNAVAILABLE"
          break
        default:
          message = error.response?.data?.message ?? error.message ?? "Error al consultar DPI"
          errorStr = error.response?.data?.error ?? "API Error"
          errorType = "API_ERROR"
      }

      // Error de conexión/red
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        message = "No se puede conectar al servicio externo. Verifique su conexión."
        errorStr = "Connection Error"
        errorType = "CONNECTION_ERROR"
        status = 503
      }

      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        message = "La conexión con el servicio externo tardó demasiado. Intente nuevamente."
        errorStr = "Timeout"
        errorType = "TIMEOUT"
        status = 408
      }
    }

    return reply.code(status).send({
      success: false,
      error: {
        type: errorType,
        status,
        message,
        error: errorStr,
      },
    })
  }
}
