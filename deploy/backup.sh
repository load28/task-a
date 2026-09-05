#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${TASK_AGENT_BACKUP_BUCKET:?Required}"
: "${AWS_REGION:?Required}"
cd /opt/task-agent
backup_name="tasks-$(date -u +%Y%m%dT%H%M%SZ)-$$.db"
staging_dir="$(mktemp -d /var/tmp/task-agent-backup.XXXXXX)"
docker compose -f compose.yaml exec -T agent node scripts/backup.ts /data/tasks.db "/tmp/$backup_name"
docker compose -f compose.yaml cp "agent:/tmp/$backup_name" "$staging_dir/$backup_name"
aws s3 cp "$staging_dir/$backup_name" "s3://$TASK_AGENT_BACKUP_BUCKET/$backup_name" --region "$AWS_REGION" --sse AES256 --only-show-errors
# Delete only the exact staging files after successful upload; failed uploads retain them.
docker compose -f compose.yaml exec -T agent node -e 'require("node:fs").unlinkSync(process.argv[1])' "/tmp/$backup_name"
rm -- "$staging_dir/$backup_name"
rmdir -- "$staging_dir"
