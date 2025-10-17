import { z } from "zod"
import type { MulterLikePart, MulterLikePartOneOrMany } from "../../types/types"
import {
  ETNIA_VALUES,
  ENTIDAD_VALUES,
  INSTITUCION_VALUES,
  DEPENDENCIA_VALUES,
  RENGLON_VALUES,
  COLEGIO_VALUES,
} from "../../catalogs/values"

export const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const CreateUserBody = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "APPLICANT"]),
  password: z.string().min(10),
})

export const ResetPasswordBody = z.object({
  email: z.email(),
})

export type LoginBodyType = z.infer<typeof LoginBody>
export type CreateUserBodyType = z.infer<typeof CreateUserBody>

const StrongPassword =
  /^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\p{N}]).{8,}$/u

const fromMultipartText = <S extends z.ZodTypeAny>(schema: S) =>
  z.preprocess((v: unknown) => {
    if (
      typeof v === "object" &&
      v !== null &&
      "value" in (v as Record<string, unknown>)
    ) {
      return (v as { value: unknown }).value
    }
    return v
  }, schema)

export const SignupOneShotBody = z.object({
  // Paso 0
  dpi: fromMultipartText(
    z
      .string()
      .trim()
      .regex(/^\d{13}$/)
  ),

  // Paso 1 (cuenta)
  email: fromMultipartText(z.email()),
  password: fromMultipartText(z.string().regex(StrongPassword)),
  primerNombre: fromMultipartText(z.string().min(2)),
  segundoNombre: fromMultipartText(z.string().optional().or(z.literal(""))),
  primerApellido: fromMultipartText(z.string().min(2)),
  segundoApellido: fromMultipartText(z.string().optional().or(z.literal(""))),
  pais: fromMultipartText(z.string().min(2)),
  ciudad: fromMultipartText(z.string().min(2)),
  correoInstitucional: fromMultipartText(
    z.email().optional().or(z.literal(""))
  ),
  correoPersonal: fromMultipartText(z.email()),

  // Paso 2 (demografía)
  cui: fromMultipartText(
    z
      .string()
      .trim()
      .regex(/^\d{13}$/)
  ),
  nit: fromMultipartText(z.string().min(8).max(13)),
  sexo: fromMultipartText(z.string().min(1)),
  edad: fromMultipartText(z.coerce.number().int().min(18).max(100)),
  departamento_residencia: fromMultipartText(z.string().min(2)),
  municipio_residencia: fromMultipartText(z.string().min(2)),
  telefono: fromMultipartText(z.string().min(8)),
  etnia: fromMultipartText(z.enum(ETNIA_VALUES)),

  // Paso 3 (institución)
  entidad: fromMultipartText(z.enum(ENTIDAD_VALUES)),
  institucion: fromMultipartText(z.enum(INSTITUCION_VALUES)),
  dependencia: fromMultipartText(z.enum(DEPENDENCIA_VALUES)),
  renglon: fromMultipartText(z.enum(RENGLON_VALUES)),
  profesion: fromMultipartText(z.string().or(z.literal(""))),
  puesto: fromMultipartText(z.string().or(z.literal(""))),
  sector: fromMultipartText(z.string().or(z.literal(""))),

  // Paso 4 (colegiado)
  colegio: fromMultipartText(z.enum(COLEGIO_VALUES)),
  numeroColegiado: fromMultipartText(z.string().min(1)),
})

export type SignupOneShotInput = z.output<typeof SignupOneShotBody>
export type SignupOneShotRaw = z.input<typeof SignupOneShotBody>

export type SignupFiles = {
  pdf_dpi?: MulterLikePartOneOrMany
  pdf_contrato?: MulterLikePartOneOrMany
  pdf_certificado_profesional?: MulterLikePartOneOrMany
}
