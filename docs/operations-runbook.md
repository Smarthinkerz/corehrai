# Operations Runbook — AI HR Agent

This runbook ties together the cadence, owners, and procedures that sustain the **100/100 audit score** in production.

---

## Cadence Overview

| Frequency | Tasks | Owner |
|---|---|---|
| **Continuous (automated)** | Sentry monitoring · structured logging · rate limit metrics · CI on every push | Platform |
| **Daily** | Triage Sentry alerts · review error rate · check `/api/health` | On-call |
| **Weekly** | Audit-log spot check · rate-limit anomaly review · backup integrity verify · dependency security scan | Platform lead |
| **Monthly** | Validate Tap webhooks · DB pool/cache metrics · Sentry quota review · rotate non-critical secrets | Platform lead + Billing ops |
| **Quarterly** | Penetration test · CSRF + 2FA regression sweep · restore drill · k6 load test · WCAG audit · rotate critical secrets · Kubernetes manifest review | Security + Platform |
| **Per release** | Update Swagger spec · regenerate admin guide deltas · expand E2E coverage · refresh onboarding tour | Feature owner |

---

## Daily Tasks

### Sentry Triage
- Open `Backend Health` and `Frontend Health` dashboards.
- Triage all P1/P2 issues opened in the last 24 hours.
- Re-prioritize or close stale issues.

### Error Rate Check
```bash
curl -s https://app.smarthinkerz.com/api/health | jq
```
Expect `status: "ok"`, `database: "connected"`. Investigate anything else.

### Log Volume
- Pino emits JSON to stdout. In Kubernetes: `kubectl logs -n hragent -l app=ai-hr-agent --since=24h | wc -l`.
- Alert if log volume drops > 50% (could indicate silent failure) or spikes > 300% (could indicate flooding).

---

## Weekly Tasks

### Audit Log Review
- `Settings → Security → Audit Log` (admin UI).
- Filter for: failed logins, role changes, plan changes, GDPR requests.
- Investigate any cluster of ≥ 10 failures from a single IP.

### Backup Integrity
```bash
ls -lh /var/backups/hragent/*.dump | tail -7
sha256sum /var/backups/hragent/hragent-$(date -d 'yesterday' +%Y%m%d)*.dump
```
Compare against the manifest file. Mismatched hashes → page on-call.

### Dependency Security Scan
```bash
npm audit --audit-level=high
```
Patch any high/critical findings within 7 days.

---

## Monthly Tasks

### Tap Webhook Validation
- Pull the last 30 days of `/api/billing/webhook/tap` events from Pino logs.
- Cross-reference against Tap Payments dashboard.
- Reconcile any discrepancies; replay missed webhooks via Tap support tools.

### Connection Pool & Cache
- Neon dashboard → check active connections (should stay < 80% of pool ceiling).
- TanStack Query cache hit rate (frontend devtools, sample 10 user sessions).

### Secret Rotation (non-critical)
Rotate: `MAILTRAP_*`, `SLACK_API_TOKEN`, `ZOOM_API_*` if approaching age policy (90 days).

---

## Quarterly Tasks

### Penetration Test
- Engage external pen-test vendor or run internal checklist (OWASP Top 10).
- File issues for any findings ≥ Medium severity.

### CSRF + 2FA Regression Sweep
```bash
npx vitest run tests/
npx playwright test e2e/auth.spec.ts
```
Manually verify:
- 2FA enrollment QR code renders.
- TOTP code accepted/rejected correctly.
- CSRF token rotation on session refresh.

### Restore Drill
See `docs/backup-restore.md`. Run `scripts/restore-drill.sh` against a scratch DB. Document in `docs/restore-drill-log.md`.

### Load Test
```bash
BASE_URL=https://staging.smarthinkerz.com k6 run scripts/k6-load-test.js
```
Compare against last quarter's results in `docs/load-test.md`. Investigate any regression > 20% in p95.

### WCAG Audit
- Run axe DevTools across the top 10 most-trafficked pages.
- Fix any Critical/Serious issues before next release.

### Critical Secret Rotation
Rotate: `SESSION_SECRET`, `DATABASE_URL` password, `OPENAI_API_KEY`, `GOOGLE_API_KEY`. Coordinate with deploys.

### Kubernetes Manifest Review
- Check `k8s/*.yaml` for outdated image tags, deprecated API versions, resource sizing.
- Update HPA thresholds based on observed CPU/memory patterns.

---

## Per-Release Tasks

### Pre-deploy Checklist
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx vitest run tests/` — all tests pass.
- [ ] `npx playwright test` — all E2E pass.
- [ ] New endpoints documented in OpenAPI (`/api/swagger.json`).
- [ ] New admin features added to `docs/admin-guide.md`.
- [ ] If schema changed: migration file generated, reviewed, committed (`docs/migrations.md`).
- [ ] If new module added: at least one E2E spec added.
- [ ] `pg_dump` backup taken via `scripts/backup-verify.sh` immediately before approving production.

### Deploy
- CI pipeline runs all gates → builds Docker image → deploys to staging automatically.
- Manual approval gate triggers production deploy via GitHub `production` environment.
- Sentry release marker created automatically in CI.

### Post-deploy
- Watch Sentry + `/api/health` for 30 minutes.
- Smoke-test critical paths: login, dashboard, employee list, billing checkout.
- Post deploy summary in `#hr-deploys` Slack.

---

## Escalation Matrix

| Severity | Examples | Response time | Escalation path |
|---|---|---|---|
| **P1** | Site down · auth broken · data loss | 5 min | PagerDuty → on-call → eng lead → CTO |
| **P2** | Major feature broken · billing webhook failing · 5xx spike | 30 min | PagerDuty → on-call → eng lead |
| **P3** | Single-page bug · cosmetic regression | next business day | Slack `#hr-alerts` → feature owner |
| **P4** | Tech debt · doc update · minor UX | next sprint | Backlog |

---

## Dashboards & Quick Links

| Dashboard | URL placeholder |
|---|---|
| Sentry — Backend Health | `https://sentry.io/organizations/your-org/dashboards/?project=ai-hr-agent-backend` |
| Sentry — Frontend Health | `https://sentry.io/organizations/your-org/dashboards/?project=ai-hr-agent-frontend` |
| Neon — Database | `https://console.neon.tech/app/projects/your-project` |
| Tap Payments — Billing | `https://dashboard.tap.company` |
| GitHub Actions — CI/CD | `https://github.com/your-org/ai-hr-agent/actions` |
| Production app | `https://app.smarthinkerz.com` |
| Health check | `https://app.smarthinkerz.com/api/health` |

---

## Reference Documents

- **Admin Guide:** `docs/admin-guide.md`
- **Backup & Restore:** `docs/backup-restore.md`
- **Migrations:** `docs/migrations.md`
- **Sentry Alerts:** `docs/sentry-alerts.md`
- **Load Testing:** `docs/load-test.md`
- **Audit Report:** `AUDIT_REPORT.md`
- **Kubernetes:** `k8s/README.md`
