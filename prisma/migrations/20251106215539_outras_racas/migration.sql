-- DropForeignKey
ALTER TABLE "cadastros_cao" DROP CONSTRAINT "cadastros_cao_racaId_fkey";

-- AlterTable
ALTER TABLE "cadastros_cao" ADD COLUMN     "racaSugerida" TEXT,
ALTER COLUMN "racaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cadastros_cao" ADD CONSTRAINT "cadastros_cao_racaId_fkey" FOREIGN KEY ("racaId") REFERENCES "raca"("racaId") ON DELETE SET NULL ON UPDATE CASCADE;
