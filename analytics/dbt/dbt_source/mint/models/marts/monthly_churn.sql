with mrr as (

    select * from {{ ref('monthly_revenue') }}

), joined as (

    -- row for month *after* last month of activity

    select
        dateadd(month, 1, date_month)::date as date_month,
        user_id,
        0::float as mrr,
        false as is_active,
        first_active_month,
        last_active_month,
        false as is_first_month,
        false as is_last_month

    from mrr

    where is_last_month

)

select * from joined