-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."edicoes" (
    "edicaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "bimestre" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "capaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edicoes_pkey" PRIMARY KEY ("edicaoId")
);
