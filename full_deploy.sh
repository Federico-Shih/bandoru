#!/bin/bash

#Deploy architecture
cd terraform
terraform init
terraform apply -auto-approve
terraform output -json > ../frontend/terraform-output.json

#Deploy frontend
cd ../frontend
website_url=$(jq -r '.spa_s3_proxy.value' "terraform-output.json")
pnpm install
./env.sh
./deploy.sh

#Deploy backend
cd ../backend
./deploy.sh

echo 'Deployment complete! :)'
echo "Website URL: $website_url"