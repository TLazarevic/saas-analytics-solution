-- CreateEnum
CREATE TYPE "priority" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "priority" "priority" NOT NULL DEFAULT 'low';
