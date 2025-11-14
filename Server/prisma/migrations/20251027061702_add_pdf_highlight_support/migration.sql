-- CreateEnum
CREATE TYPE "HighlightSource" AS ENUM ('EPUB', 'PDF');

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "pageNumber" INTEGER,
ADD COLUMN     "rects" JSONB,
ADD COLUMN     "source" "HighlightSource" NOT NULL DEFAULT 'EPUB',
ALTER COLUMN "cfiRange" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Highlight_bookId_source_idx" ON "Highlight"("bookId", "source");
