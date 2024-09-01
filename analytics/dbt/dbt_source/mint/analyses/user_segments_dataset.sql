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
            workspace_members
        group by
            workspace_id
    )
    -- Combining all event counts into a single summary per workspace
select
    coalesce(
        tc.workspace_id,
        tm.workspace_id,
        ta.workspace_id,
        la.workspace_id,
        lc.workspace_id,
        cr.workspace_id,
        br.workspace_id
    ) as workspace_id,
    coalesce(tc.task_created_count, 0) as task_created_count,
    coalesce(tm.task_modified_count, 0) as task_modified_count,
    coalesce(ta.task_archived_count, 0) as task_archived_count,
    coalesce(la.label_added_preset_count, 0) as label_added_preset_count,
    coalesce(la.label_added_custom_count, 0) as label_added_custom_count,
    coalesce(lc.label_created_count, 0) as label_created_count,
    coalesce(cr.column_renamed_count, 0) as column_renamed_count,
    coalesce(br.board_renamed_count, 0) as board_renamed_count,
    now () as data_generated_at -- Timestamp when the data was generated
from
    task_created as tc
    full outer join task_modified as tm on tc.workspace_id = tm.workspace_id
    full outer join task_archived as ta on coalesce(tc.workspace_id, tm.workspace_id) = ta.workspace_id
    full outer join label_added as la on coalesce(tc.workspace_id, tm.workspace_id, ta.workspace_id) = la.workspace_id
    full outer join label_created as lc on coalesce(
        tc.workspace_id,
        tm.workspace_id,
        ta.workspace_id,
        la.workspace_id
    ) = lc.workspace_id
    full outer join column_renamed as cr on coalesce(
        tc.workspace_id,
        tm.workspace_id,
        ta.workspace_id,
        la.workspace_id,
        lc.workspace_id
    ) = cr.workspace_id
    full outer join board_renamed as br on coalesce(
        tc.workspace_id,
        tm.workspace_id,
        ta.workspace_id,
        la.workspace_id,
        lc.workspace_id,
        cr.workspace_id
    ) = br.workspace_id
where
    coalesce(
        tc.workspace_id,
        tm.workspace_id,
        ta.workspace_id,
        la.workspace_id,
        lc.workspace_id,
        cr.workspace_id,
        br.workspace_id
    ) is not null
    and coalesce(
        tc.workspace_id,
        tm.workspace_id,
        ta.workspace_id,
        la.workspace_id,
        lc.workspace_id,
        cr.workspace_id,
        br.workspace_id
    ) != ''