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
  try {
    const { dpi } = PrefillBodySchema.parse(req.body)

    // Consultar datos del usuario en la API externa (usando el service)
    const response = await getUserByDpi(dpi)

    // Validar estructura de respuesta
    const respData = response as { list?: Array<Record<string, unknown>> }

    if (respData?.list && respData.list.length > 0) {
      // Los datos están en response.data.list[0]
      const userData = respData.list[0]

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

    // Si no hay datos en la lista o la lista está vacía
    if (respData?.list && respData.list.length === 0) {
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
          message: "DPI no encontrado - complete los campos manualmente",
        },
      })
    }

    // No se recibieron datos del servidor
    return reply.code(500).send({
      success: false,
      error: {
        status: 500,
        message: "No se recibieron datos del servidor",
        error: "No Data",
      },
    })
  } catch (error: unknown) {
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
          message: "DPI no encontrado - complete los campos manualmente",
        },
      })
    }

    // Otros errores
    const status = axios.isAxiosError(error) ? error.response?.status ?? 500 : 500
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message ?? error.message ?? "Error al consultar DPI"
      : "Error al consultar DPI"
    const errorStr = axios.isAxiosError(error) ? error.response?.data?.error ?? "API Error" : "API Error"

    return reply.code(status).send({
      success: false,
      error: {
        status,
        message,
        error: errorStr,
      },
    })
  }
}
