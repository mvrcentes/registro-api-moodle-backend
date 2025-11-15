// src/modules/moodle/moodle.schema.ts
import { z } from "zod"

// Schema para el body del prefill
export const PrefillBodySchema = z.object({
  dpi: z.string().min(13).max(13, "DPI debe tener 13 dígitos"),
})

export type PrefillBody = z.infer<typeof PrefillBodySchema>
