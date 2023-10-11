CREATE TABLE users (
    id           bigint,
    name         varchar(40),
    last_name    varchar(40),
    email        varchar(40),
    created_at   date,
    updated_at   date,
    deleted_at   date,
    CONSTRAINT production UNIQUE(email)
);

CREATE USER airbyte;
-- TODO: this gets ignored
ALTER USER airbyte WITH PASSWORD 'password';
GRANT USAGE ON SCHEMA public TO airbyte;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO airbyte;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO airbyte;
