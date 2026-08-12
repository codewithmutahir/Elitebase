-- ============================================================
-- Phase 1 analysis: pre- vs post-buffalo_sc enrollment outcomes
-- ============================================================
-- EDIT THIS DATE to match when production switched to buffalo_sc.
-- Keep in sync with:
--   Web/lib/kiosk/face-verify-instrumentation.ts → BUFFALO_SC_SWITCH_AT
-- Requires migration: 20260812120000_face_verify_attempts.sql
-- Run in Supabase SQL Editor after collecting some verify traffic.
-- ============================================================

with params as (
  -- >>> EDIT ME <<<
  select timestamptz '2026-07-18 00:00:00+00' as buffalo_sc_switch_at
),
enrolled as (
  select
    e.id as employee_id,
    e.full_name,
    e.face_registered_at,
    case
      when e.face_registered_at < (select buffalo_sc_switch_at from params)
        then 'pre_switch'
      else 'post_switch'
    end as enrollment_cohort
  from public.employees e
  where e.face_registered_at is not null
    and e.face_descriptor is not null
)

-- Primary report: verify success rate by enrollment cohort
select
  en.enrollment_cohort,
  count(*)::int as attempts,
  count(*) filter (where a.verified)::int as successes,
  count(*) filter (where not a.verified)::int as failures,
  round(
    100.0 * count(*) filter (where a.verified) / nullif(count(*), 0),
    2
  ) as success_rate_pct,
  round(avg(a.similarity_score)::numeric, 4) as avg_similarity,
  round(
    avg(a.similarity_score) filter (where not a.verified)::numeric,
    4
  ) as avg_fail_similarity,
  count(*) filter (where a.failure_reason = 'API_NO_MATCH')::int as api_no_match,
  count(*) filter (where a.failure_reason = 'LOCAL_LOW_CONFIDENCE')::int as local_low_conf,
  count(*) filter (where a.failure_reason = 'NO_FACE_DETECTED')::int as no_face_mlkit,
  count(*) filter (where a.failure_reason = 'API_ERROR')::int as api_error,
  count(*) filter (where a.failure_reason = 'TIMEOUT')::int as timeout
from public.face_verify_attempts a
join enrolled en on en.employee_id = a.employee_id
group by en.enrollment_cohort
order by en.enrollment_cohort;

-- Optional: employee roster counts by cohort (run separately)
/*
with params as (
  select timestamptz '2026-07-18 00:00:00+00' as buffalo_sc_switch_at
)
select
  case
    when face_registered_at < (select buffalo_sc_switch_at from params)
      then 'pre_switch'
    else 'post_switch'
  end as enrollment_cohort,
  count(*)::int as employees_with_face
from public.employees
where face_registered_at is not null
  and face_descriptor is not null
group by 1;
*/

-- Optional: per-employee fail rates (last 7 days)
/*
with params as (
  select timestamptz '2026-07-18 00:00:00+00' as buffalo_sc_switch_at
)
select
  e.id,
  e.full_name,
  e.face_registered_at,
  e.face_registered_at < (select buffalo_sc_switch_at from params) as is_pre_switch,
  count(a.id) filter (where a.created_at > now() - interval '7 days') as attempts_7d,
  count(a.id) filter (
    where a.created_at > now() - interval '7 days' and a.verified
  ) as successes_7d,
  round(
    avg(a.similarity_score) filter (
      where a.created_at > now() - interval '7 days' and not a.verified
    )::numeric,
    4
  ) as avg_fail_similarity_7d
from public.employees e
left join public.face_verify_attempts a on a.employee_id = e.id
where e.face_descriptor is not null
group by e.id, e.full_name, e.face_registered_at
order by is_pre_switch desc, avg_fail_similarity_7d nulls last;
*/
