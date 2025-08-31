/*
  Warnings:

  - You are about to drop the column `autor` on the `artigos` table. All the data in the column will be lost.
  - You are about to drop the column `comentarios` on the `artigos` table. All the data in the column will be lost.
  - Added the required column `autorId` to the `artigos` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `categoria` on the `artigos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."CategoriaArtigo" AS ENUM ('NUTRICAO', 'CUIDADOS', 'SAUDE', 'COMPORTAMENTO', 'TREINAMENTO', 'RACAS', 'NOTICIAS');

-- AlterTable
ALTER TABLE "public"."artigos" DROP COLUMN "autor",
DROP COLUMN "comentarios",
ADD COLUMN     "autorId" TEXT NOT NULL,
DROP COLUMN "categoria",
ADD COLUMN     "categoria" "public"."CategoriaArtigo" NOT NULL;

-- CreateTable
CREATE TABLE "public"."comentarios" (
    "comentarioId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "artigoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("comentarioId")
);

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "public"."artigos"("artigoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios" ADD CONSTRAINT "comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."artigos" ADD CONSTRAINT "artigos_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
