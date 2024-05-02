-- DropForeignKey
ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_workspace_members.user_id";

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_workspace_members.user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
