CREATE TABLE
    IF NOT EXISTS workspaces (
        id uuid,
        name varchar(255) NOT NULL,
        description varchar(255),
        is_private boolean NOT NULL,
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        deleted_at timestamp,
        PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS users (
        id uuid,
        email varchar(255) UNIQUE NOT NULL,
        username varchar(255) UNIQUE NOT NULL,
        name varchar(255),
        last_name varchar(255),
        bio varchar(255),
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        deleted_at timestamp,
        PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS workspace_members (
        user_id uuid,
        workspace_id uuid,
        PRIMARY KEY (user_id, workspace_id),
        CONSTRAINT "FK_workspace_members.user_id" FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT "FK_workspace_members.workspace_id" FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
    );

CREATE TABLE
    IF NOT EXISTS boards (
        id uuid,
        workspace_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        description varchar(255),
        is_public boolean NOT NULL,
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        deleted_at timestamp,
        PRIMARY KEY (id),
        CONSTRAINT "FK_boards.workspace_id" FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
    );

CREATE TABLE
    IF NOT EXISTS columns (
        id uuid,
        board_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        position integer NOT NULL,
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        archived_at timestamp,
        PRIMARY KEY (id),
        CONSTRAINT "FK_columns.board_id" FOREIGN KEY (board_id) REFERENCES boards (id)
    );

CREATE TABLE
    IF NOT EXISTS cards (
        id uuid,
        column_id uuid NOT NULL,
        name varchar(255) NOT NULL,
        description varchar(255),
        position integer NOT NULL,
        due_date timestamp,
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        archived_at timestamp,
        PRIMARY KEY (id),
        CONSTRAINT "FK_cards.column_id" FOREIGN KEY (column_id) REFERENCES columns (id)
    );

CREATE TYPE color AS ENUM (
    'red',
    'green',
    'blue',
    'yellow',
    'purple',
    'orange'
);

CREATE TABLE
    IF NOT EXISTS labels (
        id uuid,
        board_id uuid NOT NULL,
        name varchar(255),
        color color NOT NULL,
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        deleted_at timestamp,
        PRIMARY KEY (id),
        CONSTRAINT "FK_labels.board_id" FOREIGN KEY (board_id) REFERENCES boards (id)
    );

CREATE TABLE
    IF NOT EXISTS labeled_cards (
        card_id uuid,
        label_id uuid,
        PRIMARY KEY (card_id, label_id),
        CONSTRAINT "FK_labeled_cards.card_id" FOREIGN KEY (card_id) REFERENCES cards (id),
        CONSTRAINT "FK_labeled_cards.label_id" FOREIGN KEY (label_id) REFERENCES labels (id)
    );

CREATE TABLE
    IF NOT EXISTS preset_labels (
        id uuid,
        name varchar(255),
        color color NOT NULL,
        created_at timestamp NOT NULL,
        updated_at timestamp NOT NULL,
        deleted_at timestamp,
        PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS starred_boards (
        user_id uuid,
        board_id uuid,
        PRIMARY KEY (user_id, board_id),
        CONSTRAINT "FK_starred_boards.board_id" FOREIGN KEY (board_id) REFERENCES boards (id),
        CONSTRAINT "FK_starred_boards.user_id" FOREIGN KEY (user_id) REFERENCES users (id)
    );

CREATE TABLE
    IF NOT EXISTS card_members (
        user_id uuid,
        card_id uuid,
        PRIMARY KEY (card_id, user_id),
        CONSTRAINT "FK_card_member.card_id" FOREIGN KEY (card_id) REFERENCES cards (id),
        CONSTRAINT "FK_card_member.user_id" FOREIGN KEY (user_id) REFERENCES users (id)
    );

CREATE TYPE activity AS ENUM (
    'archive',
    'back_to_board',
    'due_date_add',
    'due_date_remove',
    'add_to_column',
    'move'
);

CREATE TABLE
    IF NOT EXISTS card_actions (
        id uuid,
        card_id uuid NOT NULL,
        user_id uuid NOT NULL,
        column_id uuid,
        from_column_id uuid,
        to_column_id uuid,
        timestamp timestamp NOT NULL,
        activity activity NOT NULL,
        due_date timestamp,
        PRIMARY KEY (id),
        CONSTRAINT "FK_card_actions.user_id" FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT "FK_card_actions.card_id" FOREIGN KEY (card_id) REFERENCES cards (id),
        CONSTRAINT "FK_card_actions.column_id" FOREIGN KEY (column_id) REFERENCES columns (id),
        CONSTRAINT "FK_card_actions.to_column_id" FOREIGN KEY (to_column_id) REFERENCES columns (id),
        CONSTRAINT "FK_card_actions.from_column_id" FOREIGN KEY (from_column_id) REFERENCES columns (id)
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