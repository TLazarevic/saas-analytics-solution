

with subscriptions as (

    select * from analytics.subscriptions

)

select
    id,
    plan_id,
    user_id,
    created_at,
    updated_at,
    cancelled_at

from subscriptions