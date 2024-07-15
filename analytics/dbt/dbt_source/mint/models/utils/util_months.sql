{{ dbt_utils.date_spine(
    datepart="month",
    start_date="toDate('2022-01-01')",
    end_date="date_trunc('month', now())"
   )
}}