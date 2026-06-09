# Sentry Alerting & Monitoring

Sentry SDK is installed and initialized in both backend (`server/sentry.ts`) and frontend (`client/src/lib/sentry.ts`). This document defines the alert rules and dashboards to configure in the Sentry web UI.

## Project Setup

Create two projects in your Sentry org:

| Project | Platform | DSN env var |
|---|---|---|
| `ai-hr-agent-backend` | Node.js | `SENTRY_DSN` (server) |
| `ai-hr-agent-frontend` | React | `VITE_SENTRY_DSN` (client) |

## Alert Rules

Configure these in **Sentry → Alerts → Create Alert**:

### Backend — `ai-hr-agent-backend`

| # | Alert Name | Condition | Action |
|---|---|---|---|
| 1 | New 500 error type | `event.level:error` AND `is:unresolved` AND `times_seen:1` | Slack `#hr-alerts` (immediate) |
| 2 | Error spike | Issue count > 50 in 5 min | PagerDuty (high) |
| 3 | Auth failures spike | `tag:route:/api/login` AND count > 100 in 5 min | Slack `#hr-security` |
| 4 | Database errors | `tag:component:db` AND count > 5 in 5 min | PagerDuty (critical) |
| 5 | Webhook failures | `transaction:POST /api/billing/webhook/tap` AND `event.level:error` | Email billing-ops + Slack `#billing` |
| 6 | Slow transactions | `p95 transaction.duration` > 1000 ms over 10 min | Slack `#hr-perf` |
| 7 | High memory | `measurements.memory.heap_used` > 800 MB sustained 5 min | Slack `#hr-ops` |

### Frontend — `ai-hr-agent-frontend`

| # | Alert Name | Condition | Action |
|---|---|---|---|
| 1 | New JS error type | `is:unresolved` AND `times_seen:1` AND users_affected > 5 | Slack `#hr-alerts` |
| 2 | Crash spike | Sessions crashed > 1% over 5 min | PagerDuty (high) |
| 3 | Failed API calls | `tag:status_code:5xx` count > 50 in 5 min | Slack `#hr-alerts` |
| 4 | Web Vitals regression | LCP p75 > 2.5 s OR CLS p75 > 0.1 | Slack `#hr-frontend` |

## Dashboards

Create these dashboards in **Sentry → Dashboards**:

1. **Backend Health** — error count, p50/p95/p99 latency, throughput, top 10 transactions, top 10 issues
2. **Frontend Health** — JS errors, sessions crashed, Web Vitals (LCP/FID/CLS), top 10 routes, browser breakdown
3. **Billing** — webhook success rate, checkout latency, plan upgrade events, Tap Payments errors
4. **Auth & Security** — login success/fail ratio, lockout count, 2FA enrollment count, CSRF rejection count

## Release Tracking

Tie deployments to releases:

```bash
# In CI after deploy:
npx sentry-cli releases new "ai-hr-agent@$(git rev-parse --short HEAD)"
npx sentry-cli releases set-commits --auto "ai-hr-agent@$(git rev-parse --short HEAD)"
npx sentry-cli releases finalize "ai-hr-agent@$(git rev-parse --short HEAD)"
npx sentry-cli releases deploys "ai-hr-agent@$(git rev-parse --short HEAD)" new -e production
```

Set `SENTRY_RELEASE` env var in deployment to the same value so events are tagged.

## On-Call Procedure

When a Sentry alert fires:

1. Acknowledge the alert in PagerDuty/Slack within 5 minutes.
2. Open the Sentry issue, check the breadcrumb trail and stack trace.
3. Check `/api/health` and the `Backend Health` dashboard.
4. If the regression correlates with a recent deploy, **roll back** the deployment first; investigate after.
5. Post an incident summary in `#hr-incidents` within 1 hour.
6. File a post-mortem within 48 hours for any P1/P2.

## Quotas & Sampling

- Backend trace sample rate: 10% in production (1.0 in dev).
- Profile sample rate: 10%.
- Frontend trace sample rate: 10%.
- Replay session sample: 0% (only `replaysOnErrorSampleRate: 100%` to capture sessions where errors occurred).
- PII scrubbing: cookies, `authorization`, `x-csrf-token` headers stripped in `beforeSend`.
