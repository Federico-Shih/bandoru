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
  value = aws_s3_bucket.bandoru-spa.bucket_domain_name
}

