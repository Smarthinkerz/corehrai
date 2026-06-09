#!/usr/bin/env bash
# Nightly database backup + verification script for AI HR Agent
#
# Usage:
#   DATABASE_URL=postgres://... BACKUP_DIR=/var/backups/hragent ./scripts/backup-verify.sh
#
# What it does:
#   1. Dumps the production database with pg_dump (custom format, compressed).
#   2. Verifies the dump file integrity with pg_restore --list.
#   3. Computes SHA-256 checksum and writes a manifest.
#   4. Prunes backups older than RETENTION_DAYS (default 30).
#   5. Optionally uploads to S3-compatible storage if BACKUP_S3_URI is set.
#   6. Exits non-zero on any failure (suitable for cron + alerting).

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${BACKUP_DIR}/hragent-${TIMESTAMP}.dump"
MANIFEST="${BACKUP_DIR}/hragent-${TIMESTAMP}.manifest.txt"

mkdir -p "${BACKUP_DIR}"

echo "[backup] Starting dump → ${DUMP_FILE}"
pg_dump --format=custom --compress=9 --no-owner --no-acl \
  --file="${DUMP_FILE}" "${DATABASE_URL}"

echo "[backup] Verifying dump integrity"
pg_restore --list "${DUMP_FILE}" > /dev/null

CHECKSUM="$(sha256sum "${DUMP_FILE}" | awk '{print $1}')"
SIZE="$(stat -c%s "${DUMP_FILE}" 2>/dev/null || stat -f%z "${DUMP_FILE}")"

cat > "${MANIFEST}" <<EOF
backup_file=hragent-${TIMESTAMP}.dump
created_at=${TIMESTAMP}
size_bytes=${SIZE}
sha256=${CHECKSUM}
pg_dump_version=$(pg_dump --version | head -1)
EOF

echo "[backup] Manifest:"
cat "${MANIFEST}"

if [[ -n "${BACKUP_S3_URI:-}" ]]; then
  echo "[backup] Uploading to ${BACKUP_S3_URI}"
  aws s3 cp "${DUMP_FILE}"  "${BACKUP_S3_URI}/" --only-show-errors
  aws s3 cp "${MANIFEST}"   "${BACKUP_S3_URI}/" --only-show-errors
fi

echo "[backup] Pruning backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name 'hragent-*.dump'         -mtime +"${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -type f -name 'hragent-*.manifest.txt' -mtime +"${RETENTION_DAYS}" -delete

echo "[backup] OK ($(du -h "${DUMP_FILE}" | awk '{print $1}'))"
