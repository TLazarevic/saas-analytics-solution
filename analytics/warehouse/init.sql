CREATE USER OR REPLACE analytics;

GRANT CREATE DATABASE ON analytics.* TO analytics;
GRANT CREATE TABLE ON analytics.* TO analytics;
GRANT DROP TABLE ON analytics.* TO analytics;
GRANT SELECT ON analytics.* TO analytics;
GRANT INSERT ON analytics.* TO analytics;
GRANT TRUNCATE ON analytics.* TO analytics;