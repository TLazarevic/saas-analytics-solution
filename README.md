# saas-analytics-solution

### Analytics solution for a demo Kanban board SaaS app - Mint



It consists of open source tools orchestrated together to form a solution for tracking usage analytics for product improvement
and a typical set of KPIs for tracking success and growth of SaaS companies.

### Data sources
- production database data of a demo application
- events emitted from client and server of a demo application

### Solution Architecture

- Warehouse: Clickhouse
- EL (of ETL): Airbyte
- Event tracking: Jitsu
- Visualization: Metabase
- Transformation (of ETL): dbt
- Orchestration: Airflow

![architecture diagram](diagrams_and_spec/Architecture_diagram.jpg)

[Event Specification](diagrams_and_spec/event_spec.md)

### Orchestration

Airflow DAG

![dag](diagrams_and_spec/data_engineering/airflow_dag.png)

### Dashboards

##### Customers and Revenue

Adjusted from dbt's example https://www.getdbt.com/blog/modeling-subscription-revenue

![customers and revenue dashboard](diagrams_and_spec/dashboards/Kandy%20Customers%20&%20Revenue.png)

##### A look at Customer Clustering Results

![customer cluster dashboard](diagrams_and_spec/dashboards/Kandy%20Customer%20Segments.png)

### Saas App - Kandy

Kanban board demo app

![demo](diagrams_and_spec/Demo.gif)

#### Relational database schema

![database schema](diagrams_and_spec/Database%20schema.png)

+ more to come
