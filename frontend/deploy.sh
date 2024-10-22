#!/bin/bash

json_file="terraform-output.json"

S3_NAME=$(jq -r '.spa_s3_bucket.value' "$json_file")

#npm build
pnpm build

aws s3 sync ./dist/frontend/browser s3://$S3_NAME --delete
