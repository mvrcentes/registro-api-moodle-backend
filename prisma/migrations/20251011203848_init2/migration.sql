-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'APPLICANT');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateEnum
CREATE TYPE "SolicitudStatus" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'REVALIDACION_PENDIENTE');

-- CreateEnum
CREATE TYPE "Etnia" AS ENUM ('MAYA', 'XINCA', 'GARIFUNA', 'LADINOS', 'EXTRANJERO', 'OTRA');

-- CreateEnum
CREATE TYPE "Renglon" AS ENUM ('PERSONAL_PERMANENTE_011', 'GRUPO_029', 'SUBGRUPO_18_Y_022', 'NO_APLICA', 'RENGLON_021');

-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entidad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Entidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institucion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Institucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependencia" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT,
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "dpi" TEXT NOT NULL,
    "nit" TEXT,
    "applicantId" TEXT,
    "status" "SolicitudStatus" NOT NULL DEFAULT 'PENDIENTE',
    "primerNombre" TEXT NOT NULL,
    "segundoNombre" TEXT,
    "primerApellido" TEXT NOT NULL,
    "segundoApellido" TEXT,
    "sexo" "Sexo" NOT NULL,
    "edad" INTEGER,
    "etnia" "Etnia" NOT NULL,
    "entidadId" TEXT,
    "institucionId" TEXT,
    "dependenciaId" TEXT,
    "departamentoId" TEXT,
    "municipioId" TEXT,
    "ciudad" TEXT,
    "pais" TEXT,
    "telefono" TEXT,
    "renglon" "Renglon" NOT NULL,
    "colegio" VARCHAR(64),
    "colegiadoNo" TEXT,
    "reviewerId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewNote" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "authorId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessToken" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "purpose" TEXT NOT NULL,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "fileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "solicitudId" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Municipio_departamentoId_idx" ON "Municipio"("departamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_name_departamentoId_key" ON "Municipio"("name", "departamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_name_key" ON "Departamento"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Entidad_name_key" ON "Entidad"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Institucion_name_key" ON "Institucion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_name_key" ON "Dependencia"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_dpi_key" ON "Solicitud"("dpi");

-- CreateIndex
CREATE INDEX "Solicitud_entidadId_idx" ON "Solicitud"("entidadId");

-- CreateIndex
CREATE INDEX "Solicitud_institucionId_idx" ON "Solicitud"("institucionId");

-- CreateIndex
CREATE INDEX "Solicitud_dependenciaId_idx" ON "Solicitud"("dependenciaId");

-- CreateIndex
CREATE INDEX "Solicitud_departamentoId_idx" ON "Solicitud"("departamentoId");

-- CreateIndex
CREATE INDEX "Solicitud_municipioId_idx" ON "Solicitud"("municipioId");

-- CreateIndex
CREATE INDEX "ReviewNote_solicitudId_idx" ON "ReviewNote"("solicitudId");

-- CreateIndex
CREATE INDEX "ReviewNote_authorId_idx" ON "ReviewNote"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessToken_token_key" ON "AccessToken"("token");

-- CreateIndex
CREATE INDEX "AccessToken_solicitudId_idx" ON "AccessToken"("solicitudId");

-- CreateIndex
CREATE INDEX "AccessToken_expiresAt_idx" ON "AccessToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Certificate_solicitudId_idx" ON "Certificate"("solicitudId");

-- CreateIndex
CREATE INDEX "Certificate_expiresAt_idx" ON "Certificate"("expiresAt");

-- CreateIndex
CREATE INDEX "File_solicitudId_idx" ON "File"("solicitudId");

-- CreateIndex
CREATE INDEX "File_uploadedByUserId_idx" ON "File"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "Municipio" ADD CONSTRAINT "Municipio_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "Entidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "Institucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNote" ADD CONSTRAINT "ReviewNote_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNote" ADD CONSTRAINT "ReviewNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
