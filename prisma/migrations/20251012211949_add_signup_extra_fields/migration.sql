/*
  Warnings:

  - Made the column `edad` on table `Solicitud` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Solicitud" ALTER COLUMN "edad" SET NOT NULL;
