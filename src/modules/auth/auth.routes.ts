import type { FastifyInstance } from "fastify"
import { requireAdmin } from "../../middlewares/requireAdmin"

import {
  adminLogin,
  adminLogout,
  adminMe,
  adminCreateUser,
  // Signup
  signupOneShot,
  // Common
  userMe,
} from "./auth.controller"
import type { CreateUserBody, LoginBody } from "./auth.schema"
import type z from "zod"

const routes = async (app: FastifyInstance) => {
  app.post<{ Body: z.input<typeof LoginBody> }>(
    "/admin/login",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    adminLogin
  )
  app.post("/admin/logout", adminLogout)
  app.get("/admin/me", adminMe)

  app.post<{ Body: z.input<typeof CreateUserBody> }>(
    "/admin/users",
    { preHandler: requireAdmin },
    adminCreateUser
  )

  // Signup
  app.post("/signup", signupOneShot)

  // Common routes
  app.get("/me", userMe)
}
export default routes
