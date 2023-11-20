# saas-analytics-solution

### Analytics solution for a demo Kanban board SaaS app.

It consists of open source tools orchestrated together to form a solution for tracking usage analytics for product improvement
and a typical set of KPIs for tracking success and growth of SaaS companies.

### Data sources
- production database data of a demo application
- events emitted from client and server of a demo application

### Architecture

- Warehouse: Clickhouse
- EL (of ETL): Airbyte
- Event tracking: Jitsu
- Visualization: Metabase
- ...

![architecture diagram](saas-app/app/kandy/public/favicon.ico)

### Saas App

![logo](diagrams/Database%20schema.png)

#### Production database schema

![database schema](diagrams/Database%20schema.png)

TBD
