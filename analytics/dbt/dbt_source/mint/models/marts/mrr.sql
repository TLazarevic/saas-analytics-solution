with unioned as (

    select
        date_month, 
        workspace_id, 
        mrr, is_active, 
        first_active_month, 
        last_active_month, 
        is_first_month, 
        is_last_month

    from {{ ref('monthly_revenue') }}

    union all

    select 
        date_month, 
        workspace_id, 
        mrr, is_active, 
        first_active_month, 
        last_active_month, 
        is_first_month, 
        is_last_month

    from {{ ref('monthly_churn') }}

),

-- get prior month MRR and calculate MRR change
mrr_with_changes as (

    select
        *,

        coalesce(
            lagInFrame(is_active, 1) over (partition by workspace_id order by date_month),
            false
        ) as previous_month_is_active,

        coalesce(
            lagInFrame(mrr, 1) over (partition by workspace_id order by date_month),
            0
        ) as previous_month_mrr,

        mrr - previous_month_mrr as mrr_change

    from unioned

),

-- classify months as new, churn, reactivation, upgrade, downgrade (or null)
-- also add an ID column
final as (

    select
        concat(toString(date_month), workspace_id) as id,

        *,

        case
            when is_first_month
                then 'new'
            when not(is_active) and previous_month_is_active
                then 'churn'
            when is_active and not(previous_month_is_active)
                then 'reactivation'
            when mrr_change > 0 then 'upgrade'
            when mrr_change < 0 then 'downgrade'
        end as change_category,

        least(mrr, previous_month_mrr) as renewal_amount

    from mrr_with_changes

)

select * from final