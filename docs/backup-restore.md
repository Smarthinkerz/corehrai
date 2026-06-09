# Backup & Restore Runbook

## Backup Strategy

| Layer | Mechanism | Frequency | Retention |
|---|---|---|---|
| **Neon PITR** (primary) | Built-in point-in-time recovery | Continuous | 7 days (Free) / 30 days (Pro+) |
| **`pg_dump` snapshot** (secondary) | `scripts/backup-verify.sh` via cron | Nightly @ 03:00 UTC | 30 days local + indefinite S3 archive |
| **Schema migrations** | Versioned SQL in `migrations/` | Per release | Permanent (in git) |

## Nightly Backup Job

Add to your scheduler (cron / Replit scheduled deployment / GitHub Actions):

```cron
0 3 * * *  DATABASE_URL=postgres://... BACKUP_DIR=/var/backups/hragent BACKUP_S3_URI=s3://hragent-backups/$(date +\%Y/\%m) /opt/hragent/scripts/backup-verify.sh >> /var/log/hragent-backup.log 2>&1
```

The script:
1. Dumps the database (`pg_dump --format=custom --compress=9`).
2. Verifies integrity (`pg_restore --list`).
3. Generates a SHA-256 manifest.
4. Optionally uploads to S3.
5. Prunes local backups older than 30 days.
6. Exits non-zero on failure → triggers alerting.

## Quarterly Restore Drill

Run on the **first business day of each quarter**:

```bash
SOURCE_DUMP=./backups/hragent-$(date -d 'yesterday' +%Y%m%d)T030000Z.dump \
DRILL_DATABASE_URL=postgres://drill_user:pass@drill-host/hragent_drill \
./scripts/restore-drill.sh
```

The drill:
1. Restores the latest dump into a non-production scratch DB (validates the restore path).
2. Runs smoke checks (row counts, FK counts, index counts).
3. Logs timing for each step.

**Pass criteria:**
- Restore completes without errors.
- `users`, `employees`, `organizations` counts > 0.
- FK count ≥ 60, index count ≥ 60.
- Total restore time < 10 minutes (alert if exceeded).

Document each drill in `docs/restore-drill-log.md` (date, source dump, duration, result, notes).

## Disaster Recovery Procedure

If production data is lost or corrupted:

1. **Halt writes** — set the app to maintenance mode (`MAINTENANCE_MODE=1`).
2. **Identify recovery point** — choose Neon PITR timestamp or `pg_dump` snapshot.
3. **Provision target** — create a fresh Neon branch or new database.
4. **Restore**:
   - PITR: Use Neon dashboard "Restore to point in time".
   - Snapshot: `pg_restore --clean --if-exists --no-owner --no-acl --dbname=<target> <dump>`
5. **Switch DATABASE_URL** to the restored DB; redeploy.
6. **Verify**: hit `/api/health`, run `npx vitest run tests/api.test.ts`.
7. **Lift maintenance mode**, post-mortem within 24 h.

**RPO:** ≤ 24 hours (nightly snapshot) or ≤ 1 minute (Neon PITR).  
**RTO:** ≤ 30 minutes for snapshot restore on a database < 10 GB.
