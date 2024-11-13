module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.13.0"

  name = "bandoru-vpc"
  cidr = "10.0.0.0/16"

  azs = slice(data.aws_availability_zones.available_azs.names, 0, 2)

  public_subnets      = ["10.0.110.0/24", "10.0.120.0/24"]
  public_subnet_names = ["public_subnet_1", "public_subnet_2"]

  private_subnets      = ["10.0.10.0/24", "10.0.20.0/24"] # private subnet with nat gw
  private_subnet_names = ["lambda_subnet_1", "lambda_subnet_2"]


  enable_nat_gateway = true
  enable_vpn_gateway = false

  enable_dns_hostnames = true
  create_igw           = true

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }

}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"


  route_table_ids = module.vpc.intra_route_table_ids
  tags = {
    Terraform   = "true"
    Environment = "s3-endpoint"
  }
}
resource "aws_vpc_endpoint_policy" "s3_endpoint_policy" {
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = module.vpc.intra_route_table_ids
  tags = {
    Terraform   = "true"
    Environment = "dynamodb-endpoint"
  }
}
resource "aws_vpc_endpoint_policy" "dynamodb_endpoint_policy" {
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}
resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.us-east-1.sqs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.bandoru_lambda_sg.id]

  tags = {
    Terraform   = "true"
    Environment = "sqs-endpoint"
  }

}
resource "aws_vpc_endpoint_policy" "sqs_endpoint_policy" {
  vpc_endpoint_id = aws_vpc_endpoint.sqs.id
}
resource "aws_security_group" "bandoru_lambda_sg" {
  name   = "bandoru-lambda-sg"
  vpc_id = module.vpc.vpc_id
  tags = {
    Name = "bandoru-lambda-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "bandoru_lambda_sg_ingress_rule" {
  security_group_id = aws_security_group.bandoru_lambda_sg.id

  ip_protocol = -1
  cidr_ipv4   = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "bandoru_lambda_sg_egress_rule" {
  security_group_id = aws_security_group.bandoru_lambda_sg.id

  ip_protocol = -1
  cidr_ipv4   = "0.0.0.0/0"
}


resource "aws_sqs_queue" "failed_webhooks" {
  name = "failed-webhooks-queue"
}


resource "aws_sqs_queue" "update-notifications" {
  name                      = "update-notification-queue"
  delay_seconds             = 0
  max_message_size          = 4096
  message_retention_seconds = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.failed_webhooks.arn
    maxReceiveCount     = 3 #retries
  })
  visibility_timeout_seconds = 6
}

module "lambdas" {
  depends_on = [module.vpc, aws_s3_bucket_website_configuration.spa-website-config, aws_cognito_user_pool_client.default-client]

  source          = "./modules/lambda"
  lambda_role_arn = data.aws_iam_role.lab_role.arn
  lambda_configs = [
    {
      method        = "POST"
      function_name = "post_bandoru"
      route         = "/bandoru"
    },
    {
      method        = "GET"
      function_name = "get_bandorus"
      route         = "/bandoru"
    },
    {
      method        = "GET"
      function_name = "get_bandoru"
      route         = "/bandoru/{id}"
    },
    {
      method        = "PUT"
      function_name = "put_bandoru"
      route         = "/bandoru/{id}"
    },
    {
      method        = "GET"
      function_name = "get_bandoru_webhooks"
      route         = "/bandoru/{id}/webhooks"
    },
    {
      method        = "PUT"
      function_name = "put_bandoru_webhooks"
      route         = "/bandoru/{id}/webhooks"
    },
    {
      method        = "POST"
      function_name = "post_bookmarks"
      route         = "/users/{uid}/bookmarks"
    },
    {
      method        = "GET"
      function_name = "get_bookmarks"
      route         = "/users/{uid}/bookmarks"
    },
    {
      method        = "DELETE"
      function_name = "delete_bookmarks"
      route         = "/users/{uid}/bookmarks/{id}"
    },
    {
      method        = "POST"
      function_name = "post_bandoru_updated"
      route         = "/bandoru/{id}/updated"
    },
    {
      method        = "GET"
      function_name = "get_failed_webhooks"
      route         = "/bandoru/{id}/failed_webhooks"
    }
  ]

  #TODO: Add other env variables
  lambda_environment_variables = zipmap(
    ["S3_BUCKET", "USER_POOL_ID", "APP_CLIENT_ID", "DB_TABLE", "DB_USER_IDX", "UPDATE_NOTIFICATION_SQS"],
    [
      aws_s3_bucket.bandoru-bucket.id,
      aws_cognito_user_pool.pool.id,
      aws_cognito_user_pool_client.default-client.id,
      var.dynamodb-table-name,
      var.dynamodb-user-idx,
      aws_sqs_queue.update-notifications.url,
    ]
  )
  api_gw_name             = "bandoru-api"
  vpc_subnets_ids         = module.vpc.private_subnets
  vpc_security_group_ids  = [aws_security_group.bandoru_lambda_sg.id]
  allowed_origins         = ["http://${aws_s3_bucket_website_configuration.spa-website-config.website_endpoint}", aws_apigatewayv2_api.spa-proxy.api_endpoint]
  path_to_placeholder_zip = "${abspath(path.root)}/hello.zip"
}

// SQS Lambda Trigger

resource "aws_lambda_function" "update_notification_lambda" {
  filename      = "${abspath(path.root)}/hello.zip"
  function_name = "notify_update_webhook"
  role          = data.aws_iam_role.lab_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"
  environment {
    variables = {
      "FRONTEND_URL" = aws_apigatewayv2_api.spa-proxy.api_endpoint
    }
  }
  layers = ["arn:aws:lambda:us-east-1:017000801446:layer:AWSLambdaPowertoolsPythonV3-python312-x86_64:2"]
}

resource "aws_lambda_event_source_mapping" "update_notification_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.update-notifications.arn
  enabled                            = true
  function_name                      = aws_lambda_function.update_notification_lambda.function_name
  batch_size                         = 5
  maximum_batching_window_in_seconds = 5 # Cuanto espera a que se llene el buffer
  # Enable failure reporting
  function_response_types = ["ReportBatchItemFailures"]
}
resource "aws_lambda_permission" "allow_sqs_update" {
  statement_id  = "AllowExecutionFromSQS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_notification_lambda.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.update-notifications.arn
}

resource "aws_lambda_function" "save_failed_webhook_lambda" {
  filename      = "${abspath(path.root)}/hello.zip"
  function_name = "save_failed_webhook"
  role          = data.aws_iam_role.lab_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"
  environment {
    variables = {
      "DB_TABLE"    = var.dynamodb-table-name,
      "DB_USER_IDX" = var.dynamodb-user-idx
    }
  }
  layers = ["arn:aws:lambda:us-east-1:017000801446:layer:AWSLambdaPowertoolsPythonV3-python312-x86_64:2"]
}
resource "aws_lambda_permission" "allow_sqs_failed" {
  statement_id  = "AllowExecutionFromSQS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.save_failed_webhook_lambda.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = aws_sqs_queue.failed_webhooks.arn
}

resource "aws_lambda_event_source_mapping" "failed_notification_event_source_mapping" {
  event_source_arn = aws_sqs_queue.failed_webhooks.arn
  enabled          = true
  function_name    = aws_lambda_function.save_failed_webhook_lambda.function_name
  batch_size       = 5
}
