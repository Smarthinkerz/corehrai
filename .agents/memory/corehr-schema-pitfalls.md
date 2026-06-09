---
name: CoreHR Schema Column Pitfalls
description: Common column name mismatches in CoreHR AI tables — always grep schema.ts before writing seed SQL.
---

# CoreHR Schema Column Pitfalls

**Rule:** Always read `shared/schema.ts` for the exact column name before writing any INSERT SQL. The Drizzle camelCase JS name does NOT always map to what you'd expect as snake_case.

**Why:** Multiple seed attempts failed due to wrong column names, requiring multiple correction rounds.

**Known mismatches:**
- `job_postings`: column is `type` (not `employment_type`), `status` default is `active` (not `open`)
- `candidates`: column is `position` + `department` (not `position_applied`), status is `new` not `applied`
- `leave_requests`: column is `user_id` (not `employee_id`), `type` (not `leave_type`), no `approved_by` — use `reviewed_by`
- `announcements`: no `target_audience` or `author_id` — use `created_by`, has `category`, `is_published`, `published_at`
- `documents`: no `type` or `content` or `status` — uses `file_url`, `file_type`, `file_size`, `category`, `uploaded_by`
- `wellness_metrics`: no `date`, `sleep_hours`, `stress_level`, `exercise_minutes`, `mood_score` — uses `record_date`, `stress_level`, `work_life_balance`, `satisfaction`, `energy_level`, `physical_activity`
- `peer_recognitions`: no `visibility` — uses `is_public`; no `approved` column
- `recognitions`: columns are `from_user_id` + `to_user_id` (not `giver_id`/`receiver_id`)
- `hr_tasks`: column is `task_name` (not `title`); has `category` (required); has `organization_id`
- `autopilot_kill_switches`: primary key is `organization_id` only; columns are `paused`, `paused_by`, `paused_at`, `reason`
- `copilot_conversations`: column is `copilot_key` (not `copilot_type`); has `title`, `messages`, `pinned`
- `onboarding_buddies`: no `notes` — columns are `buddy_id`, `new_hire_id`, `status`, `match_score`, `match_reasons`, `feedback`, `start_date`, `end_date`
- `autopilot_actions`: completely different schema — columns: `organization_id`, `workflow_key`, `mode`, `status`, `title`, `summary`, `input`, `output`, `entity_type`, `entity_id`, `decided_by`, `approver_user_id`, `error_message`
- `engagement_surveys`: no `is_active` or `due_date` — uses `start_date`, `end_date`, `status` (draft/active/completed)

**How to apply:** Before any INSERT, run: `grep -A15 "tableName = pgTable" shared/schema.ts`
