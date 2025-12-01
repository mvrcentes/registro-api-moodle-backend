import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "../../db"
import type { $Enums } from "../../generated/prisma"
import type { Prisma } from "../../generated/prisma"
import { createMoodleUser } from "../moodle-lms/moodle-lms.service"

type ApplicationStatus = "pending" | "in_review" | "approved" | "rejected"

const statusMap: Record<$Enums.SolicitudStatus, ApplicationStatus> = {
  PENDIENTE: "pending",
  EN_REVISION: "in_review",
  APROBADA: "approved",
  RECHAZADA: "rejected",
  REVALIDACION_PENDIENTE: "in_review",
}

const renglonMap: Record<$Enums.Renglon, string> = {
  PERSONAL_PERMANENTE_011: "PERSONAL PERMANENTE 011",
  GRUPO_029: "GRUPO 029",
  SUBGRUPO_18_Y_022: "SUBGRUPO 18 Y 022",
  NO_APLICA: "NO APLICA",
  RENGLON_021: "RENGLÓN 021",
}

interface FileInfo {
  id: string
  path: string
  mimeType: string
  sizeBytes: number
}

interface ApplicationListItem {
  id: string
  email: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  dpi: string
  entidad: string
  institucion: string
  renglon: string
  status: ApplicationStatus
  submittedAt: string
  etnia?: string
  dependencia?: string
  colegio?: string
  telefono?: string
  direccion?: string
  files?: FileInfo[]
}

// Tipos para los requests
export interface UpdateStatusParams {
  id: string
}

export interface UpdateStatusBody {
  status: "approved" | "rejected" | "in_review"
  note?: string
}

// Handler para aprobar/rechazar/cambiar estado
export async function updateApplicationStatusHandler(
  req: FastifyRequest<{ Params: UpdateStatusParams; Body: UpdateStatusBody }>,
  reply: FastifyReply
) {
  const { id } = req.params
  const { status, note } = req.body

  // Validar que el status sea válido
  if (!["approved", "rejected", "in_review"].includes(status)) {
    return reply.code(400).send({
      ok: false,
      error: "Invalid status. Must be 'approved', 'rejected', or 'in_review'",
    })
  }

  // Mapear status del frontend al backend
  const statusBackendMap: Record<string, $Enums.SolicitudStatus> = {
    approved: "APROBADA",
    rejected: "RECHAZADA",
    in_review: "EN_REVISION",
  }

  const newStatus = statusBackendMap[status]

  try {
    // Verificar que la solicitud existe y obtener datos necesarios
    const existingSolicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        dpi: true,
        nit: true,
        primerNombre: true,
        primerApellido: true,
        segundoApellido: true,
        correoPersonal: true,
        correoInstitucional: true,
        sexo: true,
        edad: true,
        departamentoName: true,
        municipioName: true,
        etnia: true,
        telefono: true,
        sector: true,
        institucionName: true,
        dependenciaName: true,
        renglon: true,
        colegio: true,
        colegiadoNo: true,
        applicant: {
          select: {
            email: true,
            passwordHash: true,
          },
        },
      },
    })

    if (!existingSolicitud) {
      return reply.code(404).send({
        ok: false,
        error: "Solicitud no encontrada",
      })
    }

    // Actualizar la solicitud
    const updateData: Prisma.SolicitudUpdateInput = {
      status: newStatus,
    }

    // Agregar fecha según el estado
    if (newStatus === "APROBADA") {
      updateData.approvedAt = new Date()
    } else if (newStatus === "RECHAZADA") {
      updateData.rejectedAt = new Date()
    }

    const solicitud = await prisma.solicitud.update({
      where: { id },
      data: updateData,
    })

    // Si hay nota, crear ReviewNote
    if (note && note.trim().length > 0) {
      await prisma.reviewNote.create({
        data: {
          solicitudId: id,
          message: note.trim(),
        },
      })
    }

    // Si se aprobó la solicitud, crear usuario en Moodle (no bloqueante)
    if (newStatus === "APROBADA") {
      const email =
        existingSolicitud.correoInstitucional ??
        existingSolicitud.correoPersonal ??
        existingSolicitud.applicant?.email ??
        ""

      // Fire-and-forget: no await para no bloquear la respuesta
      if (email) {
        const moodleUsername = existingSolicitud.dpi

        createMoodleUser({
          username: moodleUsername,
          firstname: existingSolicitud.primerNombre,
          lastname: `${existingSolicitud.primerApellido} ${
            existingSolicitud.segundoApellido || ""
          }`.trim(),
          email: email,
          profile: {
            dpi: existingSolicitud.dpi,
            nit: existingSolicitud.nit ?? undefined,
            sexo: existingSolicitud.sexo,
            edad: existingSolicitud.edad,
            departamento: existingSolicitud.departamentoName ?? "",
            municipio: existingSolicitud.municipioName ?? "",
            etnia: existingSolicitud.etnia,
            telefono: existingSolicitud.telefono ?? undefined,
            sector: existingSolicitud.sector ?? undefined,
            institucion: existingSolicitud.institucionName ?? undefined,
            dependencia: existingSolicitud.dependenciaName ?? undefined,
            renglon: existingSolicitud.renglon ?? undefined,
            colegio: existingSolicitud.colegio ?? undefined,
            colegiadoNo: existingSolicitud.colegiadoNo ?? undefined,
          },
        })
          .then((moodleResult) => {
            req.log.info(
              { moodleResult, solicitudId: id },
              "Moodle user created successfully (async)"
            )
          })
          .catch((moodleError) => {
            req.log.error(
              { err: moodleError, solicitudId: id },
              "Error creating Moodle user (non-critical, async)"
            )
          })
      } else {
        req.log.warn(
          { solicitudId: id },
          "No email available for Moodle user creation"
        )
      }
    }

    return reply.send({
      ok: true,
      data: {
        id: solicitud.id,
        status: statusMap[solicitud.status],
        message: `Solicitud ${
          status === "approved"
            ? "aprobada y usuario creado en Moodle"
            : status === "rejected"
            ? "rechazada"
            : "actualizada"
        } exitosamente`,
      },
    })
  } catch (error) {
    req.log.error({ err: error }, "Error updating application status")
    return reply.code(500).send({
      ok: false,
      error: "Error al actualizar el estado de la solicitud",
    })
  }
}

export async function listApplicationsHandler(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  const solicitudes = await prisma.solicitud.findMany({
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    include: {
      applicant: { select: { email: true } },
      Entidad: { select: { name: true } },
      Institucion: { select: { name: true } },
      Dependencia: { select: { name: true } },
      files: {
        select: {
          id: true,
          path: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  })

  const data: ApplicationListItem[] = solicitudes.map((solicitud) => {
    const email =
      solicitud.correoInstitucional ??
      solicitud.correoPersonal ??
      solicitud.applicant?.email ??
      ""

    const entidad =
      solicitud.entidadName ?? solicitud.Entidad?.name ?? "SOCIEDAD CIVIL"

    const institucion =
      solicitud.institucionName ?? solicitud.Institucion?.name ?? "NO APLICA"

    const dependencia =
      solicitud.dependenciaName ?? solicitud.Dependencia?.name ?? undefined

    const submittedAt =
      solicitud.submittedAt?.toISOString() ?? solicitud.createdAt.toISOString()

    const direccionParts = [
      solicitud.municipioName,
      solicitud.departamentoName,
    ].filter(Boolean)

    return {
      id: solicitud.id,
      email,
      primerNombre: solicitud.primerNombre,
      segundoNombre: solicitud.segundoNombre ?? undefined,
      primerApellido: solicitud.primerApellido,
      segundoApellido: solicitud.segundoApellido ?? undefined,
      dpi: solicitud.dpi,
      entidad,
      institucion,
      renglon: renglonMap[solicitud.renglon] ?? "NO APLICA",
      status: statusMap[solicitud.status] ?? "pending",
      submittedAt,
      etnia: solicitud.etnia ?? undefined,
      dependencia,
      colegio: solicitud.colegio ?? undefined,
      telefono: solicitud.telefono ?? undefined,
      direccion:
        direccionParts.length > 0 ? direccionParts.join(", ") : undefined,
      files:
        solicitud.files?.map((file) => ({
          id: file.id,
          path: file.path,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        })) ?? [],
    }
  })

  return reply.send({ ok: true, data })
}

export async function getMetricsHandler(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  const totalApplications = await prisma.solicitud.count()

  const applicationsByStatus = await prisma.solicitud.groupBy({
    by: ["status"],
    _count: { status: true },
  })
  const statusCounts: Record<ApplicationStatus, number> = {
    pending: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
  }

  for (const group of applicationsByStatus) {
    const mappedStatus = statusMap[group.status]
    statusCounts[mappedStatus] = group._count.status
  }

  return reply.send({
    ok: true,
    data: {
      totalApplications,
      applicationsByStatus: statusCounts,
    },
  })
}
