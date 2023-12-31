-- airflow
CREATE USER OR REPLACE analytics;

GRANT CREATE DATABASE ON analytics.* TO analytics;
GRANT CREATE TABLE ON analytics.* TO analytics;
GRANT DROP TABLE ON analytics.* TO analytics;
GRANT SELECT ON analytics.* TO analytics;
GRANT INSERT ON analytics.* TO analytics;
GRANT TRUNCATE ON analytics.* TO analytics;

-- jitsu
CREATE DATABASE IF NOT EXISTS events;
CREATE USER OR REPLACE jitsu IDENTIFIED WITH plaintext_password BY 'jitsu';

GRANT CREATE DATABASE ON events.* TO jitsu;
GRANT CREATE TABLE ON events.* TO jitsu;
GRANT DROP TABLE ON events.* TO jitsu;
GRANT SELECT ON events.* TO jitsu;
GRANT INSERT ON events.* TO jitsu;
GRANT TRUNCATE ON events.* TO jitsu;

-- metabase
CREATE USER OR REPLACE metabase;
GRANT SELECT ON analytics.* TO metabase;
GRANT SELECT ON events.* TO metabase;
