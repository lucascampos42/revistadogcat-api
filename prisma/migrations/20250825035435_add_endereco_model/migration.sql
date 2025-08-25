-- CreateEnum
CREATE TYPE "public"."TipoEndereco" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'ENTREGA', 'COBRANCA', 'TEMPORARIO', 'OUTRO');

-- CreateTable
CREATE TABLE "public"."enderecos" (
    "enderecoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "public"."TipoEndereco" NOT NULL,
    "nome" TEXT,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "pontoReferencia" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("enderecoId")
);

-- AddForeignKey
ALTER TABLE "public"."enderecos" ADD CONSTRAINT "enderecos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
