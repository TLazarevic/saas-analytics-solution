Page visits and marketing attribution are tracked by default.

| Event          | Description                                                         | Properties (user_id, timestamp are mandatory)                   | Feature                                                | Status      |
|:---------------|:--------------------------------------------------------------------|:----------------------------------------------------------------|:-------------------------------------------------------|:------------|
| Task Created   |                                                                     | Workspace ID, Board ID, Card ID, name                           | core features                                          | Implemented |
| Task Modified  | Cards name, priority, description get modified                      | Workspace ID, Board ID, Card ID, modified fields                | core features/productivity enchancement (if priority) | Implemented |                                                  
| Task Archived  |                                                                     | Workspace ID, Board ID, Card ID                                 | core features                                          | Implemented |
| Column Renamed |                                                                     | Workspace ID, Board ID, Column ID                               | personalization                                        | Implemented |
| Board Renamed  |                                                                     | Workspace ID, Board ID                                          | personalization                                        | Implemented |
| Label Added    | When editing and creating cards                                 | Workspace ID, Board ID, Card ID, Label ID type [preset, custom] | productivity enchancement if preset                | Implemented |
| Label Created  |                                                                     | Workspace ID, Board ID, Label ID                                | personalization (because it's custom)                        | Implemented |
| Label Modified |                                                                     | Workspace ID, Board ID, Label ID modified fields                | personalization (because it's custom)                        | Implemented |

