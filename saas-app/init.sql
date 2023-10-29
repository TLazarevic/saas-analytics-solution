CREATE TABLE
    "workspace" (
        "id" uuid,
        "name" varchar(255),
        "description" varchar(255),
        "is_private" boolean,
        "created_at" timestamp,
        "updated_at" timestamp,
        "deleted_at" timestamp,
        PRIMARY KEY ("id")
    );

CREATE TABLE
    "user" (
        "id" uuid,
        "email" varchar(255) UNIQUE ,
        "name" varchar(255),
        "last_name" varchar(255),
        "created_at" timestamp,
        "updated_at" timestamp,
        "deleted_at" timestamp,
        PRIMARY KEY ("id")
    );

CREATE TABLE
    "workspace_member" (
        "user_id" uuid,
        "workspace_id" uuid,
        PRIMARY KEY ("user_id", "workspace_id"),
        FOREIGN KEY ("workspace_id") REFERENCES "workspace" ("id"),
        FOREIGN KEY ("user_id") REFERENCES "user" ("id")
    );

CREATE TABLE
    "board" (
        "id" uuid,
        "workspace_id" uuid,
        "name" varchar(255),
        "description" varchar(255),
        "is_public" boolean,
        "created_at" timestamp,
        "updated_at" timestamp,
        "deleted_at" timestamp,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("workspace_id") REFERENCES "workspace" ("id")
    );

CREATE TABLE
    "column" (
        "id" uuid,
        "board_id" uuid,
        "name" varchar(255),
        "created_at" timestamp,
        "updated_at" timestamp,
        "archived_at" timestamp,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("board_id") REFERENCES "board" ("id")
    );

CREATE TABLE
    "card" (
        "id" uuid,
        "column_id" uuid,
        "name" varchar(255),
        "description" varchar(255),
        "due_date" timestamp,
        "created_at" timestamp,
        "updated_at" timestamp,
        "archived_at" timestamp,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("column_id") REFERENCES "column" ("id")
    );

CREATE TYPE color AS ENUM ('red', 'green', 'blue', 'yellow', 'purple');

CREATE TABLE
    "label" (
        "id" uuid,
        "board_id" uuid,
        "name" varchar(255),
        "color" color,
        "created_at" timestamp,
        "updated_at" timestamp,
        "deleted_at" timestamp,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("board_id") REFERENCES "board" ("id")
    );

CREATE TABLE
    "labeled_cards" (
        "card_id" uuid,
        "label_id" uuid,
        PRIMARY KEY ("card_id", "label_id"),
        FOREIGN KEY ("label_id") REFERENCES "label" ("id"),
        FOREIGN KEY ("card_id") REFERENCES "card" ("id")
    );

CREATE TABLE
    "preset_label" (
        "id" uuid,
        "name" varchar(255),
        "color" color,
        "created_at" timestamp,
        "updated_at" timestamp,
        "deleted_at" timestamp,
        PRIMARY KEY ("id")
    );

CREATE TABLE
    "starred_boards" (
        "user_id" uuid,
        "board_id" uuid,
        PRIMARY KEY ("user_id", "board_id"),
        FOREIGN KEY ("user_id") REFERENCES "user" ("id"),
        FOREIGN KEY ("board_id") REFERENCES "board" ("id")
    );

CREATE TABLE
    "card_member" (
        "user_id" uuid,
        "card_id" uuid,
        FOREIGN KEY ("card_id") REFERENCES "card" ("id"),
        FOREIGN KEY ("user_id") REFERENCES "user" ("id")
    );

CREATE TYPE activity AS ENUM ('red', 'green', 'blue', 'yellow', 'purple');

CREATE TABLE
    "card_activity_log" (
        "id" uuid,
        "card_id" uuid,
        "user_id" uuid,
        "timestamp" timestamp,
        "activity" activity,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("card_id") REFERENCES "card" ("id"),
        FOREIGN KEY ("user_id") REFERENCES "user" ("id")
    );

CREATE USER airbyte;

-- TODO: this gets ignored
ALTER USER airbyte
WITH
    PASSWORD 'password';

GRANT USAGE ON SCHEMA public TO airbyte;

GRANT
SELECT
    ON ALL TABLES IN SCHEMA public TO airbyte;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT
SELECT
    ON TABLES TO airbyte;