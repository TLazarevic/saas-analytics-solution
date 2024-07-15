/*
  Warnings:

  - You are about to drop the column `user_id` on the `subscriptions` table. All the data in the column will be lost.
  - Added the required column `seats` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspace_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "user_id",
ADD COLUMN     "seats" INTEGER NOT NULL,
ADD COLUMN     "workspace_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
