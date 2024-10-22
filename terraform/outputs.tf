output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.pool.id
}

output "hosted_ui_client_id" {
  value = aws_cognito_user_pool_client.default-client.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.main.domain
}

output "api_gw_endpoint" {
  value = module.lambdas.api_gw_endpoint
}
output "spa_s3_url" {
  value = "http://${aws_s3_bucket_website_configuration.spa-website-config.website_endpoint}"
}
output "spa_s3_bucket" {
  value = aws_s3_bucket.bandoru-spa.bucket
}
output "spa_s3_proxy" {
  value = aws_apigatewayv2_api.spa-proxy.api_endpoint
}

