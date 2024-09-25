#!/bin/bash

S3_NAME="bandoru-spa-62293"

pnpm build

aws s3 sync ./dist/frontend/browser s3://$S3_NAME --delete
