#!/usr/bin/env bash
# Build the frontend for a sandbox deployment and sync it to a private UI S3
# bucket served by an nginx-ECS proxy.
#
# VITE_* vars are baked into the bundle at build time, so the build must run with
# the target env. This script loads them from an env file (default .env.sandbox)
# — anything already exported in the shell overrides the file.
#
# Required (env or args):
#   S3_BUCKET     target UI bucket
#   AWS_PROFILE   AWS profile / credentials
# Optional:
#   AWS_REGION    (default: ap-south-1)
#   ENV_FILE      (default: .env.sandbox)
#
# Usage:
#   S3_BUCKET=<bucket> AWS_PROFILE=<profile> ./scripts/deploy-ui.sh
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.sandbox}"
AWS_REGION="${AWS_REGION:-ap-south-1}"

: "${S3_BUCKET:?set S3_BUCKET to the target UI bucket}"
: "${AWS_PROFILE:?set AWS_PROFILE to the deploying profile}"
export AWS_PROFILE AWS_REGION

if [ ! -f "$ENV_FILE" ]; then
  echo "env file '$ENV_FILE' not found. Create it from .env.example with sandbox VITE_* values" >&2
  echo "(or set ENV_FILE=... / export the VITE_* vars before running)." >&2
  exit 1
fi

# Pre-flight: fail early if AWS creds are missing/expired.
aws sts get-caller-identity >/dev/null

echo "Loading env from $ENV_FILE"
set -a
# shellcheck disable=SC1090
. "./$ENV_FILE"
set +a

echo "Installing deps (npm ci)..."
npm ci

echo "Building (tsc -b && vite build)..."
npm run build   # outputs to dist/

if [ ! -d dist ]; then
  echo "build produced no dist/ — aborting" >&2; exit 1
fi

echo "Syncing dist/ -> s3://$S3_BUCKET/ (profile=$AWS_PROFILE region=$AWS_REGION)"
# Hashed asset files are immutable -> long cache. index.html must not be cached
# so a new deploy is picked up immediately (nginx also no-caches the app shell).
aws s3 sync dist/ "s3://$S3_BUCKET/" \
  --delete \
  --exclude index.html \
  --cache-control "public,max-age=31536000,immutable"
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo "Done. Deployed to s3://$S3_BUCKET/ — verify at the sandbox UI URL."
