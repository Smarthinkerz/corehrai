#!/usr/bin/env bash
# Quarterly restore drill — restores the latest dump into a scratch database
# and runs smoke checks. Suitable for unattended quarterly cron.
#
# Usage:
#   SOURCE_DUMP=./backups/hragent-20260504T030000Z.dump \
#   DRILL_DATABASE_URL=postgres://.../hragent_drill \
#   ./scripts/restore-drill.sh

set -euo pipefail

: "${SOURCE_DUMP:?SOURCE_DUMP path is required}"
: "${DRILL_DATABASE_URL:?DRILL_DATABASE_URL is required (must be a NON-PRODUCTION database)}"

if [[ "${DRILL_DATABASE_URL}" == "${DATABASE_URL:-}" ]]; then
  echo "[drill] FATAL: DRILL_DATABASE_URL must not equal DATABASE_URL" >&2
  exit 1
fi

echo "[drill] Restoring ${SOURCE_DUMP} → ${DRILL_DATABASE_URL}"
pg_restore --clean --if-exists --no-owner --no-acl \
  --dbname="${DRILL_DATABASE_URL}" "${SOURCE_DUMP}"

echo "[drill] Running smoke checks"
psql "${DRILL_DATABASE_URL}" <<'SQL'
\timing on
SELECT 'users' AS table, count(*) FROM users
UNION ALL SELECT 'employees', count(*) FROM employees
UNION ALL SELECT 'organizations', count(*) FROM organizations
UNION ALL SELECT 'departments', count(*) FROM departments;
SELECT 'fk_count' AS check, count(*) FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY';
SELECT 'index_count' AS check, count(*) FROM pg_indexes WHERE schemaname = 'public';
SQL

echo "[drill] PASS — restore + smoke checks completed"
