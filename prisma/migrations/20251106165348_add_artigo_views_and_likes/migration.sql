-- CreateTable
CREATE TABLE "artigo_views" (
    "viewId" TEXT NOT NULL,
    "artigoId" TEXT NOT NULL,
    "userId" TEXT,
    "fingerprint" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artigo_views_pkey" PRIMARY KEY ("viewId")
);

-- CreateTable
CREATE TABLE "artigo_curtidas" (
    "curtidaId" TEXT NOT NULL,
    "artigoId" TEXT NOT NULL,
    "userId" TEXT,
    "fingerprint" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artigo_curtidas_pkey" PRIMARY KEY ("curtidaId")
);

-- CreateIndex
CREATE INDEX "artigo_views_artigoId_idx" ON "artigo_views"("artigoId");

-- CreateIndex
CREATE INDEX "artigo_views_fingerprint_artigoId_idx" ON "artigo_views"("fingerprint", "artigoId");

-- CreateIndex
CREATE INDEX "artigo_curtidas_artigoId_idx" ON "artigo_curtidas"("artigoId");

-- CreateIndex
CREATE UNIQUE INDEX "artigo_curtidas_fingerprint_artigoId_key" ON "artigo_curtidas"("fingerprint", "artigoId");

-- AddForeignKey
ALTER TABLE "artigo_views" ADD CONSTRAINT "artigo_views_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "artigos"("artigoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigo_curtidas" ADD CONSTRAINT "artigo_curtidas_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "artigos"("artigoId") ON DELETE CASCADE ON UPDATE CASCADE;
