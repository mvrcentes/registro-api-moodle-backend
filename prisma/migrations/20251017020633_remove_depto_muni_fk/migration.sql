-- DropIndex
DROP INDEX "public"."Solicitud_departamentoId_idx";

-- DropIndex
DROP INDEX "public"."Solicitud_municipioId_idx";

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "departamentoName" TEXT,
ADD COLUMN     "municipioName" TEXT;
