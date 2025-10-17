-- DropIndex
DROP INDEX "public"."Solicitud_dependenciaId_idx";

-- DropIndex
DROP INDEX "public"."Solicitud_entidadId_idx";

-- DropIndex
DROP INDEX "public"."Solicitud_institucionId_idx";

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "dependenciaName" TEXT,
ADD COLUMN     "entidadName" TEXT,
ADD COLUMN     "institucionName" TEXT;
