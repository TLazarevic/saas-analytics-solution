/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `labels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "labels" DROP COLUMN "deleted_at";
