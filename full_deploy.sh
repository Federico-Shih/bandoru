#!/bin/bash

set -e

#Deploy architecture
cd terraform
terraform init
terraform apply -auto-approve
terraform output -json > ../frontend/terraform-output.json

echo -e "\nDone Deploying Architecture"

#Deploy frontend

cd ../frontend

docker build -t bandoru-frontend .

cd ..

mkdir -p ./frontend_build
mkdir -p ./urls

docker run --rm -v $(pwd)/frontend_build:/frontend/dist/frontend/browser -v $(pwd)/urls/:/urls bandoru-frontend

S3_NAME=$(cat ./urls/s3.txt)
website_url=$(cat ./urls/website.txt)

echo -e "\Deploying Frontend"

aws s3 sync ./frontend_build s3://$S3_NAME --delete

echo -e "\Done Deploying Frontend"

#Deploy backend

docker build -t bandoru-backend ./backend

mkdir -p ./backend_build

docker run --rm -v $(pwd)/backend_build:/build bandoru-backend

echo -e "\Deploying Backend"

for filepath in ./backend_build/*.zip; do
  filename="${filepath##*/}"
  function_name=${filename%.zip}

  aws lambda update-function-code \
    --no-cli-pager \
    --function-name "$function_name" \
    --zip-file fileb://$filepath
done

echo -e "\Done Deploying Backend"

echo 'Deployment complete! :)'
echo "Website URL: $website_url"
