-- CreateEnum
CREATE TYPE "activity" AS ENUM ('archive', 'back_to_board', 'due_date_add', 'due_date_remove', 'add_to_column', 'move');

-- CreateEnum
CREATE TYPE "color" AS ENUM ('red', 'green', 'blue', 'yellow', 'purple', 'orange');

-- CreateTable
CREATE TABLE "boards" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_actions" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "column_id" UUID,
    "from_column_id" UUID,
    "to_column_id" UUID,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "activity" "activity" NOT NULL,
    "due_date" TIMESTAMP(6),

    CONSTRAINT "card_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_members" (
    "user_id" UUID NOT NULL,
    "card_id" UUID NOT NULL,

    CONSTRAINT "card_members_pkey" PRIMARY KEY ("card_id","user_id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "column_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "position" INTEGER NOT NULL,
    "due_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "archived_at" TIMESTAMP(6),

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "columns" (
    "id" UUID NOT NULL,
    "board_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "archived_at" TIMESTAMP(6),

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labeled_cards" (
    "card_id" UUID NOT NULL,
    "label_id" UUID NOT NULL,

    CONSTRAINT "labeled_cards_pkey" PRIMARY KEY ("card_id","label_id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" UUID NOT NULL,
    "board_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "color" "color" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_labels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "color" "color" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "preset_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starred_boards" (
    "user_id" UUID NOT NULL,
    "board_id" UUID NOT NULL,

    CONSTRAINT "starred_boards_pkey" PRIMARY KEY ("user_id","board_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "last_name" VARCHAR(255),
    "bio" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "user_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("user_id","workspace_id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "is_private" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "FK_boards.workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_actions" ADD CONSTRAINT "FK_card_actions.card_id" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_actions" ADD CONSTRAINT "FK_card_actions.column_id" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_actions" ADD CONSTRAINT "FK_card_actions.from_column_id" FOREIGN KEY ("from_column_id") REFERENCES "columns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_actions" ADD CONSTRAINT "FK_card_actions.to_column_id" FOREIGN KEY ("to_column_id") REFERENCES "columns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_actions" ADD CONSTRAINT "FK_card_actions.user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_members" ADD CONSTRAINT "FK_card_member.card_id" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_members" ADD CONSTRAINT "FK_card_member.user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "FK_cards.column_id" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "columns" ADD CONSTRAINT "FK_columns.board_id" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labeled_cards" ADD CONSTRAINT "FK_labeled_cards.card_id" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labeled_cards" ADD CONSTRAINT "FK_labeled_cards.label_id" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "FK_labels.board_id" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "starred_boards" ADD CONSTRAINT "FK_starred_boards.board_id" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "starred_boards" ADD CONSTRAINT "FK_starred_boards.user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_workspace_members.user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_workspace_members.workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

