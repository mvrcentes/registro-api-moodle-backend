import { join } from "node:path"
import { mkdirSync, createWriteStream } from "node:fs"
import { v4 as uuid } from "uuid"
import { pipeline } from "node:stream/promises"
import type { MultipartFile } from "@fastify/multipart"
import type { MulterLikePart } from "../../../types/types"
import type { $Enums } from "../../../generated/prisma"
import { prisma } from "../../../db"

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
}

const RENGLON_MAP: Record<string, $Enums.Renglon> = {
  // existentes
  "PERSONAL PERMANENTE 011": "PERSONAL_PERMANENTE_011",
  "GRUPO 029": "GRUPO_029",
  "SUBGRUPO 18 Y 022": "SUBGRUPO_18_Y_022",
  "NO APLICA": "NO_APLICA",
  "RENGLON 021": "RENGLON_021",
  "RENGLÓN 021": "RENGLON_021", // alias con acento
}

let ENTIDAD_MAP: Record<string, string> = {}
let INSTITUCION_MAP: Record<string, string> = {}

export async function initCatalogCache() {
  const [entidades, instituciones] = await Promise.all([
    prisma.entidad.findMany({ select: { id: true, name: true } }),
    prisma.institucion.findMany({ select: { id: true, name: true } }),
  ])
  ENTIDAD_MAP = Object.fromEntries(entidades.map((e) => [e.name, e.id]))
  INSTITUCION_MAP = Object.fromEntries(instituciones.map((i) => [i.name, i.id]))
}

export function resolveEntidadIdFromValue(value: string) {
  const id = ENTIDAD_MAP[value]
  if (!id) throw new CatalogNotFoundError("entidad", value)
  return id
}

export function resolveInstitucionIdFromValue(value: string) {
  const id = INSTITUCION_MAP[value]
  if (!id) throw new CatalogNotFoundError("institucion", value)
  return id
}

export class CatalogNotFoundError extends Error {
  constructor(
    public field:
      | "entidad"
      | "institucion"
      | "dependencia"
      | "departamento"
      | "municipio",
    public value: string
  ) {
    super(`${field.toUpperCase()}_NOT_FOUND`)
  }
}

export function mapRenglon(value: string): $Enums.Renglon {
  const key = norm(value)
  const direct = RENGLON_MAP[value] || RENGLON_MAP[key]
  if (!direct) throw new Error("RENGLON_INVALID")
  return direct
}

export function mapSexo(s: string): $Enums.Sexo {
  const u = s.toUpperCase()
  if (u === "MASCULINO" || u === "FEMENINO") return u as $Enums.Sexo
  throw new Error("SEXO_INVALID")
}

// ===== almacenamiento =====
// Base en disco y base pública
const UPLOADS_BASE_DIR =
  process.env.UPLOADS_DIR || join(process.cwd(), "uploads")
const PUBLIC_UPLOADS_BASE = "/uploads"

// Asegura la carpeta base
mkdirSync(UPLOADS_BASE_DIR, { recursive: true })

export type SavedFile = { relPath: string; mimeType: string; sizeBytes: number }

export async function savePdf(
  part: MultipartFile | MulterLikePart | undefined,
  dpi: string,
  kind: "dpi" | "contratos" | "certificados"
): Promise<SavedFile | null> {
  if (!part || !part.file) return null

  const mimetype = "mimetype" in part && part.mimetype ? String(part.mimetype) : ""
  const filenameIn = "filename" in part && part.filename ? String(part.filename) : ""
  const looksPdf =
    /\/pdf$/i.test(mimetype) ||
    /\.pdf$/i.test(filenameIn) ||
    mimetype.toLowerCase().includes("pdf")

  if (!looksPdf) throw new Error("INVALID_FILE_TYPE")

  const dir = join(UPLOADS_BASE_DIR, dpi, kind)
  mkdirSync(dir, { recursive: true })

  const filename = `${uuid()}.pdf`
  const absPath = join(dir, filename)
  const ws = createWriteStream(absPath)

  let sizeBytes = 0
  const fileStream = part.file as NodeJS.ReadableStream
  fileStream.on("data", (chunk: Buffer) => {
    sizeBytes += chunk.length
  })

  await pipeline(fileStream, ws)

  const relPath = join(PUBLIC_UPLOADS_BASE, dpi, kind, filename).replace(/\\/g, "/")
  return { relPath, mimeType: mimetype || "application/pdf", sizeBytes }
}
