import { z } from "zod"
import { UserRole } from "../../../generated/prisma"

export const UsersBody = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum([UserRole.ADMIN, UserRole.APPLICANT]),
})
