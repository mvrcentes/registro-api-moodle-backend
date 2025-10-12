// scripts/create-admin.ts
import "dotenv/config"
import { prisma } from "../src/db"
import { hashPassword } from "../src/modules/auth/auth.service"

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error("Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en env o CLI.")
    console.error("Ejemplo:")
    console.error(
      'ADMIN_EMAIL=admin@registro.local ADMIN_PASSWORD="ClaveLarga123!" bun run scripts/create-admin.ts'
    )
    process.exit(1)
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    console.log(`Ya existe un usuario con email ${email}`)
    process.exit(0)
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email,
      role: "ADMIN",
      passwordHash,
      mustResetPassword: true,
      isActive: true,
    },
    select: { id: true, role: true },
  })

  console.log("✅ Admin creado:", user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
