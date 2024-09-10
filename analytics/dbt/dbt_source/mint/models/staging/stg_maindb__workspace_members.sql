with source as (

  select * from {{ source('main_db', 'workspace_members') }}

), result as (

  select
    user_id,
    workspace_id

  from source

)

select * from result
