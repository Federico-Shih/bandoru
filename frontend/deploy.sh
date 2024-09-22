#!/bin/bash

S3_NAME="bandoru-spa"

pnpm build

aws s3 sync ./dist/frontend/browser s3://$S3_NAME --delete