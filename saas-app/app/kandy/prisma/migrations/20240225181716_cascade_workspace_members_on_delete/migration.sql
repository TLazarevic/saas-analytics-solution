-- DropForeignKey
ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_workspace_members.workspace_id";

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_workspace_members.workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
