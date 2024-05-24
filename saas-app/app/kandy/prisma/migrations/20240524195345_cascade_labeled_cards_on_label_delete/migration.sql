-- DropForeignKey
ALTER TABLE "labeled_cards" DROP CONSTRAINT "FK_labeled_cards.label_id";

-- AddForeignKey
ALTER TABLE "labeled_cards" ADD CONSTRAINT "FK_labeled_cards.label_id" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
