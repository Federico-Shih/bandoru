#!/bin/bash

json_file="terraform-output.json"

api_gw_endpoint=$(jq -r '.api_gw_endpoint.value' "$json_file")
cognito_user_pool_id=$(jq -r '.cognito_user_pool_id.value' "$json_file")
hosted_ui_client_id=$(jq -r '.hosted_ui_client_id.value' "$json_file")
region='us-east-1'

cat <<EOL > ./src/environments/environment.ts
export const environment = {
  apiUrl: "$api_gw_endpoint",
  cognitoClientId: "$hosted_ui_client_id",
  cognitoUserPoolId: "$cognito_user_pool_id",
  region: '$region',
};
EOL

echo "environment.ts has been generated successfully."

