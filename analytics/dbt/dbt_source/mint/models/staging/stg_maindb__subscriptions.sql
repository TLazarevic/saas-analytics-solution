{{ config(materialized='table') }}

with source as (

  select * from {{ source('main_db', 'subscriptions') }}

), result as (

  select
    id,
    plan_id,
    user_id,

    created_at,
    date_trunc('day', created_at) as created_date,

    updated_at,
    date_trunc('day', updated_at) as updated_date,

    cancelled_at,
    date_trunc('day', cancelled_at) as cancelled_date,

  from source

)

select * from result
