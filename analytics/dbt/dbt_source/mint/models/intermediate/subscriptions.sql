with subscriptions as (

  select * from {{ ref('stg_maindb__subscriptions') }}

), subscription_plans as (

    select * from {{ ref('stg_maindb__subscription_plans') }}

), result as (

  select
    subscriptions.id,
    subscriptions.plan_id,
    subscriptions.workspace_id,

    subscriptions.created_at,
    subscriptions.created_date,

    subscriptions.updated_at,
    subscriptions.updated_date,

    subscriptions.cancelled_at,
    subscriptions.cancelled_date,

    subscription_plans.name,
    subscription_plans.price

  from subscriptions

  inner join subscription_plans
    on subscriptions.plan_id = subscription_plans.id

)

select * from result
