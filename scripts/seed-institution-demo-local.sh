#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export WRANGLER_LOG_PATH=.wrangler/wrangler.log
exec pnpm exec wrangler d1 execute gfes-greenfin-eco-system-db --local --file=./scripts/seed-institution-demo-local.sql
