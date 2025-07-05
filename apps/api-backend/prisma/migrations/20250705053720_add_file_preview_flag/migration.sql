/*
  Warnings:

  - You are about to drop the column `file_path` on the `datasets` table. All the data in the column will be lost.
  - You are about to drop the column `file_size` on the `datasets` table. All the data in the column will be lost.
  - You are about to drop the column `file_type` on the `datasets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "datasets" DROP COLUMN "file_path",
DROP COLUMN "file_size",
DROP COLUMN "file_type";

-- CreateTable
CREATE TABLE "dataset_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "mime_type" TEXT,
    "upload_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_previewable" BOOLEAN NOT NULL DEFAULT false,
    "dataset_id" TEXT NOT NULL,

    CONSTRAINT "dataset_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dataset_files" ADD CONSTRAINT "dataset_files_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
