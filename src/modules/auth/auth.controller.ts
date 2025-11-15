// src/modules/auth/auth.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify"
import type { z } from "zod"
import { prisma } from "../../db"
import {
  LoginBody,
  CreateUserBody,
  SignupOneShotBody,
  type SignupOneShotInput,
  type SignupFiles,
} from "./auth.schema"
import type { MulterLikePart } from "../../types/types"
import {
  createSession,
  revokeSession,
  verifyPassword,
  hashPassword,
  getSession,
} from "./auth.service"
import {
  mapRenglon,
  type SavedFile,
  savePdf,
  mapSexo,
  mapEtnia,
} from "./singup/signup.helpers"
import type {
  Multipart,
  MultipartFile,
  MultipartValue,
} from "@fastify/multipart"

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-sid" : "sid"
const COOKIE_SECURE = process.env.NODE_ENV === "production"

type LoginReq = FastifyRequest<{ Body: z.input<typeof LoginBody> }>
type CreateUserReq = FastifyRequest<{ Body: z.input<typeof CreateUserBody> }>

// #region admin controllers
export async function adminLogin(req: LoginReq, reply: FastifyReply) {
  const { email, password } = LoginBody.parse(req.body)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash || user.role !== "ADMIN" || !user.isActive) {
    return reply.code(401).send({ error: "BAD_CREDENTIALS" })
  }

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) return reply.code(401).send({ error: "BAD_CREDENTIALS" })

  const { token, expiresAt } = await createSession(user.id, {
    ua: req.headers["user-agent"] as string | undefined,
    ip: req.ip,
  })

  reply.setCookie(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  })

  return reply.send({ ok: true, mustResetPassword: user.mustResetPassword })
}

export async function adminLogout(req: FastifyRequest, reply: FastifyReply) {
  const sid =
    req.cookies?.[COOKIE_NAME] ??
    req.cookies?.sid ??
    req.cookies?.["__Host-sid"]
  if (sid) {
    await revokeSession(sid)
    reply.clearCookie("sid", { path: "/" })
    reply.clearCookie("__Host-sid", { path: "/" })
  }
  return reply.send({ ok: true })
}

export async function adminMe(req: FastifyRequest, reply: FastifyReply) {
  const sid =
    req.cookies?.[COOKIE_NAME] ??
    req.cookies?.sid ??
    req.cookies?.["__Host-sid"]
  if (!sid) return reply.code(401).send({ error: "UNAUTHORIZED" })

  const session = await getSession(sid)
  if (
    !session ||
    !session.user ||
    session.expiresAt < new Date() ||
    session.user.role !== "ADMIN"
  ) {
    return reply.code(401).send({ error: "UNAUTHORIZED" })
  }

  return reply.send({
    ok: true,
    user: { id: session.user.id, role: session.user.role },
  })
}

export async function adminCreateUser(req: CreateUserReq, reply: FastifyReply) {
  const body = CreateUserBody.parse(req.body)
  const passwordHash = await hashPassword(body.password)

  const user = await prisma.user.create({
    data: {
      email: body.email,
      role: body.role,
      passwordHash,
      mustResetPassword: true,
    },
    select: { id: true, role: true },
  })

  return reply.code(201).send(user)
}
// #endregion

// #region signup controller
export async function signupOneShot(req: FastifyRequest, reply: FastifyReply) {
  // (1) Validación/coerción
  const parsed = SignupOneShotBody.safeParse(req.body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join("."),
      code: i.code,
      message: i.message,
    }))

    const isInvalidTypeUndefined = (
      i: unknown
    ): i is {
      code: "invalid_type"
      received: "undefined"
      path: Array<string | number>
    } => {
      if (typeof i !== "object" || i === null) return false
      const r = i as Record<string, unknown>
      const codeOk = r.code === "invalid_type"
      const receivedOk = r.received === "undefined"
      const pathOk =
        Array.isArray(r.path) &&
        (r.path as unknown[]).every(
          (p) => typeof p === "string" || typeof p === "number"
        )
      return codeOk && receivedOk && pathOk
    }

    const missing = parsed.error.issues
      .filter(isInvalidTypeUndefined)
      .map((i) => i.path.join("."))

    return reply.code(400).send({
      error: "VALIDATION_ERROR",
      missing, // ← lista de campos faltantes
      issues, // ← detalle por campo
      fieldErrors: parsed.error.flatten().fieldErrors, // compat
    })
  }
  const body: SignupOneShotInput = parsed.data

  // (2) Obtener archivos desde req.body (attachFieldsToBody: true los pone ahí)
  const b = req.body as unknown as SignupFiles
  const pickFirst = (
    x: MulterLikePart | MulterLikePart[] | undefined
  ): MulterLikePart | undefined => (Array.isArray(x) ? x[0] : x)

  const dpiPart = pickFirst(b?.pdf_dpi)
  const contratoPart = pickFirst(b?.pdf_contrato)
  const certProfPart = pickFirst(b?.pdf_certificado_profesional)

  // Log para debugging
  req.log.info({
    hasDpi: !!dpiPart,
    hasContrato: !!contratoPart,
    hasCertProf: !!certProfPart,
    dpiHasToBuffer: dpiPart && "toBuffer" in dpiPart,
    contratoHasToBuffer: contratoPart && "toBuffer" in contratoPart,
    certProfHasToBuffer: certProfPart && "toBuffer" in certProfPart,
  }, "Files received")

  // (3) Guardar PDFs (estructura por DPI)
  let dpiFile: SavedFile | null = null
  let contratoFile: SavedFile | null = null
  let certProfFile: SavedFile | null = null

  try {
    dpiFile = await savePdf(dpiPart, body.dpi, "dpi")
    contratoFile = await savePdf(contratoPart, body.dpi, "contratos")
    certProfFile = await savePdf(certProfPart, body.dpi, "certificados")
  } catch (e) {
    req.log.error({ err: e }, "FILE_UPLOAD_ERROR")
    return reply.code(400).send({ error: "FILE_UPLOAD_ERROR" })
  }

  // (4)
  const departamentoName = body.departamento_residencia
  const municipioName = body.municipio_residencia

  // (4.5) El status viene del frontend
  // Si el usuario fue pre-llenado desde la API -> APROBADA (sin archivos)
  // Si el usuario NO fue pre-llenado -> PENDIENTE (con archivos)
  const solicitudStatus = body.status || "PENDIENTE"

  // (4.6) Truncar campos que pueden ser muy largos
  const truncate = (str: string | undefined | null, maxLength: number): string | null => {
    if (!str) return null
    return str.length > maxLength ? str.substring(0, maxLength) : str
  }

  const colegioTruncated = truncate(body.colegio, 64)

  // (5) Transacción: User + Solicitud + Files
  const result = await prisma.$transaction(async (tx) => {
    // 5.1 Usuario (APPLICANT) si no existe
    const existing = await tx.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    })
    const userId =
      existing?.id ??
      (
        await tx.user.create({
          data: {
            email: body.email,
            role: "APPLICANT",
            passwordHash: await hashPassword(body.password),
            isActive: true,
            mustResetPassword: false,
          },
          select: { id: true },
        })
      ).id

    // 5.2 Upsert de solicitud por DPI
    const solicitud = await tx.solicitud.upsert({
      where: { dpi: body.dpi },
      update: {
        applicant: { connect: { id: userId } },
        primerNombre: body.primerNombre,
        segundoNombre: body.segundoNombre || null,
        primerApellido: body.primerApellido,
        segundoApellido: body.segundoApellido || null,

        sexo: mapSexo(body.sexo),
        edad: body.edad,
        nit: body.nit,
        telefono: body.telefono,
        pais: body.pais,
        ciudad: body.ciudad,

        // FK por relaciones
        entidadName: body.entidad,
        institucionName: body.institucion || body.entidad,
        dependenciaName: body.dependencia || null,

        // Mantén depto/muni por FK (o cámbialos a texto si no quieres depender de BD)
        departamentoName: departamentoName,
        municipioName: municipioName,

        renglon: mapRenglon(body.renglon),
        profesion: body.profesion || null,
        puesto: body.puesto || null,
        sector: body.sector || null,

        colegio: colegioTruncated,
        colegiadoNo: body.numeroColegiado,

        correoInstitucional: body.correoInstitucional || null,
        correoPersonal: body.correoPersonal || null,

        status: solicitudStatus,
        submittedAt: new Date(),
        ...(solicitudStatus === "APROBADA" ? { approvedAt: new Date() } : {}),
      },

      create: {
        dpi: body.dpi,
        applicant: { connect: { id: userId } },

        primerNombre: body.primerNombre,
        segundoNombre: body.segundoNombre || null,
        primerApellido: body.primerApellido,
        segundoApellido: body.segundoApellido || null,

        sexo: mapSexo(body.sexo),
        edad: body.edad,
        nit: body.nit,
        telefono: body.telefono,
        pais: body.pais,
        ciudad: body.ciudad,
        etnia: mapEtnia(body.etnia),

        // FK por relaciones
        entidadName: body.entidad,
        institucionName: body.institucion || body.entidad,
        dependenciaName: body.dependencia || null,

        // Mantén depto/muni por FK (o pásalos a texto si quieres)
        departamentoName: departamentoName,
        municipioName: municipioName,

        renglon: mapRenglon(body.renglon),
        profesion: body.profesion || null,
        puesto: body.puesto || null,
        sector: body.sector || null,

        colegio: colegioTruncated,
        colegiadoNo: body.numeroColegiado,

        correoInstitucional: body.correoInstitucional || null,
        correoPersonal: body.correoPersonal || null,

        status: solicitudStatus,
        submittedAt: new Date(),
        ...(solicitudStatus === "APROBADA" ? { approvedAt: new Date() } : {}),
      },
      select: { id: true },
    })

    // 5.3 Registros File (si hay)
    const files: {
      path: string
      mimeType: string
      sizeBytes: number
      solicitudId: string
      uploadedByUserId: string
    }[] = []
    if (dpiFile)
      files.push({
        path: dpiFile.relPath,
        mimeType: dpiFile.mimeType,
        sizeBytes: dpiFile.sizeBytes,
        solicitudId: solicitud.id,
        uploadedByUserId: userId,
      })
    if (contratoFile)
      files.push({
        path: contratoFile.relPath,
        mimeType: contratoFile.mimeType,
        sizeBytes: contratoFile.sizeBytes,
        solicitudId: solicitud.id,
        uploadedByUserId: userId,
      })
    if (certProfFile)
      files.push({
        path: certProfFile.relPath,
        mimeType: certProfFile.mimeType,
        sizeBytes: certProfFile.sizeBytes,
        solicitudId: solicitud.id,
        uploadedByUserId: userId,
      })

    if (files.length > 0) await tx.file.createMany({ data: files })

    return { solicitudId: solicitud.id }
  })

  // (6) Respuesta
  return reply.code(201).send({
    ok: true,
    data: {
      solicitudId: result.solicitudId,
      status: solicitudStatus,
      message: solicitudStatus === "APROBADA"
        ? "Solicitud aprobada automáticamente"
        : "Solicitud pendiente de revisión",
      files: {
        dpi: dpiFile?.relPath ?? null,
        contrato: contratoFile?.relPath ?? null,
        certificadoProfesional: certProfFile?.relPath ?? null,
      },
      uploadsDir: process.env.UPLOADS_DIR || "<cwd>/uploads",
    },
  })
}
// #endregion

// #region applicant controllers

// #endregion

// #region common controllers
export async function userMe(req: FastifyRequest, reply: FastifyReply) {
  const sid =
    req.cookies?.[COOKIE_NAME] ??
    req.cookies?.sid ??
    req.cookies?.["__Host-sid"]
  if (!sid) return reply.code(401).send({ error: "UNAUTHORIZED" })

  const session = await getSession(sid)
  if (!session || !session.user || session.expiresAt < new Date()) {
    return reply.code(401).send({ error: "UNAUTHORIZED" })
  }

  // Perfil mínimo apto para UI (GDPR/OWASP friendly)
  const { id, role, email, firstName, lastName } = session.user
  return reply.send({
    ok: true,
    user: {
      id,
      role, // "ADMIN" | "APPLICANT"
      email: email ?? undefined, // opcional
      name: [firstName, lastName].filter(Boolean).join(" ") || undefined, // opcional
    },
  })
}
// #endregion
