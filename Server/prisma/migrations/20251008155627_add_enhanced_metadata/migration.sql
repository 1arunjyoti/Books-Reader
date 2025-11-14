-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "description" TEXT,
ADD COLUMN     "genre" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pdfMetadata" TEXT,
ADD COLUMN     "publicationYear" INTEGER,
ADD COLUMN     "publisher" TEXT;
