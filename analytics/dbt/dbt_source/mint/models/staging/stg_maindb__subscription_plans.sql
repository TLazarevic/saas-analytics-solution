with source as (

  select * from {{ source('main_db', 'subscription_plans') }}

), result as (

  select
    id,
    name,
    price,
    price*100 as price_cents,

    created_at,
    date_trunc('day', created_at) as created_date,

    updated_at,
    date_trunc('day', updated_at) as updated_date,

    deleted_at,
    date_trunc('day', deleted_at) as deleted_date

  from source

)

select * from result
