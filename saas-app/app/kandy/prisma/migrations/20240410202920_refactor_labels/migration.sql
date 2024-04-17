/*
  Warnings:

  - You are about to drop the `preset_labels` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "labels" ADD COLUMN     "is_preset" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "board_id" DROP NOT NULL;

-- DropTable
DROP TABLE "preset_labels";
