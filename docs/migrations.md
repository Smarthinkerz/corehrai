# Database Migration Runbook

## Policy

> **No direct `db:push` against production.** All schema changes must flow through versioned, peer-reviewed SQL migration files committed to `migrations/`.

## Tooling

We use **Drizzle Kit**:

- `drizzle-kit generate` — diffs `shared/schema.ts` against the current snapshot and writes a new SQL file under `migrations/`.
- `drizzle-kit migrate` — applies pending migrations against `DATABASE_URL`.
- `drizzle-kit push` — direct push (development only — **never in production**).

## Workflow

### Development (local Replit dev)
1. Edit `shared/schema.ts`.
2. Iterate freely with `npm run db:push` to test rapidly.
3. **Before opening a PR**, run:
   ```bash
   npx drizzle-kit generate --name=<short_description>
   ```
4. Review the generated SQL in `migrations/`. Hand-edit if the auto-diff is wrong (e.g., destructive operations need explicit `DROP COLUMN` review, data migrations need backfill SQL).
5. Commit `shared/schema.ts` **and** the new `migrations/*.sql` together in the same PR.

### Pull Request Review
The reviewer must verify:
- [ ] Migration is **additive-first** (new columns nullable; backfill, then NOT NULL in a follow-up).
- [ ] No `DROP TABLE` / `DROP COLUMN` without a deprecation cycle.
- [ ] Index creation uses `CONCURRENTLY` if the table is large.
- [ ] Data migrations are idempotent.
- [ ] Backfill scripts (if any) are committed under `scripts/migrations/`.

### Staging Deploy (CI)
The `.github/workflows/ci.yml` `deploy-staging` job runs:
```bash
npx drizzle-kit migrate
```
Failures abort the deploy.

### Production Deploy (CI with manual approval)
Same `drizzle-kit migrate` command, but gated by the GitHub `production` environment approval. The deploying engineer is responsible for:
1. Confirming the staging migration applied cleanly and the app is healthy.
2. Triggering a fresh `pg_dump` backup immediately before approving production.
3. Approving the GitHub deploy.
4. Watching `/api/health`, error rates, and Sentry for 30 minutes post-deploy.

## Rollback

- **Forward-fix is preferred.** Write a new corrective migration.
- **If you must roll back schema:** restore from the pre-deploy `pg_dump` (see `docs/backup-restore.md`).
- Never edit or delete an already-applied migration file. Add a new one.

## Destructive Change Procedure

For any column drop, table rename, or type change:

1. **Release N**: Add new column / new table; deploy.
2. **Release N+1**: Dual-write (write to both old and new); deploy.
3. **Release N+2**: Switch reads to new; deploy. Monitor.
4. **Release N+3**: Stop writing to old; deploy.
5. **Release N+4**: Drop old column / table; deploy.

Each step is its own PR and migration file.
