-- Aggregates usage for each workspace.
with
    task_created as (
        select
            workspace_id,
            count(*) as task_created_count
        from
            {{ source('events', 'Task Created') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    task_modified as (
        select
            workspace_id,
            count(*) as task_modified_count
        from
            {{ source('events', 'Task Modified') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    task_archived as (
        select
            workspace_id,
            count(*) as task_archived_count
        from
            {{ source('events', 'Task Archived') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    label_added as (
        select
            workspace_id,
            count(
                CasE
                    WHEN type = 'preset' THEN 1
                END
            ) as label_added_preset_count,
            count(
                CasE
                    WHEN type = 'custom' THEN 1
                END
            ) as label_added_custom_count
        from
            {{ source('events', 'Label Added') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    label_created as (
        select
            workspace_id,
            count(*) as label_created_count
        from
            {{ source('events', 'Label Created') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    label_modified as (
        select
            workspace_id,
            count(*) as label_modified_count
        from
            {{ source('events', 'Label Modified') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    column_renamed as (
        select
            workspace_id,
            count(*) as column_renamed_count
        from
            {{ source('events', 'Column Renamed') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    board_renamed as (
        select
            workspace_id,
            count(*) as board_renamed_count
        from
            {{ source('events', 'Board Renamed') }}
        where
            timestamp >= now () - interval '6 months'
        group by
            workspace_id
    ),
    workspace_members_count as (
        select
            workspace_id,
            count(*) as member_count
        from
            {{ ref('stg_maindb__workspace_members') }}
        group by
            workspace_id
    )
    -- Combining all event counts into a single summary per workspace
select
    wm.workspace_id,
    wm.member_count,
    case when wm.member_count > 1 then True else False end as has_multiple_users,
    coalesce(tc.task_created_count, 0) as task_created_count,
    coalesce(tm.task_modified_count, 0) as task_modified_count,
    coalesce(ta.task_archived_count, 0) as task_archived_count,
    coalesce(la.label_added_preset_count, 0) as label_added_preset_count,
    coalesce(la.label_added_custom_count, 0) as label_added_custom_count,
    coalesce(lc.label_created_count, 0) as label_created_count,
    coalesce(lc.label_modified_count, 0) as label_modified_count,
    coalesce(cr.column_renamed_count, 0) as column_renamed_count,
    coalesce(br.board_renamed_count, 0) as board_renamed_count,
    now () as data_generated_at -- Timestamp when the data was generated
from
    workspace_members_count as wm
    left join task_created as tc on wm.workspace_id = tc.workspace_id
    left join task_modified as tm on wm.workspace_id = tm.workspace_id
    left join task_archived as ta on wm.workspace_id = ta.workspace_id
    left join label_added as la on wm.workspace_id = la.workspace_id
    left join label_created as lc on wm.workspace_id = lc.workspace_id
    left join label_modified as lm on wm.workspace_id = lm.workspace_id
    left join column_renamed as cr on wm.workspace_id = cr.workspace_id
    left join board_renamed as br on wm.workspace_id = br.workspace_id