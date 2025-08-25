-- CreateEnum
CREATE TYPE "public"."StatusArtigo" AS ENUM ('PUBLICADO', 'RASCUNHO', 'REVISAO');

-- CreateEnum
CREATE TYPE "public"."SexoCao" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "public"."VideoOption" AS ENUM ('UPLOAD', 'URL', 'WHATSAPP', 'NONE');

-- CreateTable
CREATE TABLE "public"."artigos" (
    "artigoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" JSONB NOT NULL,
    "resumo" TEXT,
    "autor" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "status" "public"."StatusArtigo" NOT NULL DEFAULT 'RASCUNHO',
    "dataPublicacao" TIMESTAMP(3) NOT NULL,
    "imagemCapa" TEXT NOT NULL,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "curtidas" INTEGER NOT NULL DEFAULT 0,
    "comentarios" INTEGER NOT NULL DEFAULT 0,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "artigos_pkey" PRIMARY KEY ("artigoId")
);

-- CreateTable
CREATE TABLE "public"."cadastros_cao" (
    "cadastroId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proprietarioDiferente" BOOLEAN NOT NULL DEFAULT false,
    "nomeProprietario" TEXT,
    "cpfProprietario" TEXT,
    "emailProprietario" TEXT,
    "telefoneProprietario" TEXT,
    "enderecoProprietario" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "nome" TEXT NOT NULL,
    "raca" TEXT NOT NULL,
    "sexo" "public"."SexoCao" NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "fotoPerfil" TEXT NOT NULL,
    "fotoLateral" TEXT NOT NULL,
    "peso" TEXT,
    "altura" TEXT,
    "temPedigree" BOOLEAN NOT NULL DEFAULT false,
    "registroPedigree" TEXT,
    "pedigreeFrente" TEXT,
    "pedigreeVerso" TEXT,
    "temMicrochip" BOOLEAN NOT NULL DEFAULT false,
    "numeroMicrochip" TEXT,
    "titulos" TEXT,
    "caracteristicas" TEXT,
    "videoOption" "public"."VideoOption" NOT NULL DEFAULT 'NONE',
    "videoUrl" TEXT,
    "whatsappContato" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cadastros_cao_pkey" PRIMARY KEY ("cadastroId")
);

-- AddForeignKey
ALTER TABLE "public"."cadastros_cao" ADD CONSTRAINT "cadastros_cao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
