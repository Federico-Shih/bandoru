
resource "aws_lambda_function" "lambda" {
    for_each = { for index, lambda in var.lambda_configs: lambda.function_name => lambda }

    filename = "./hello.zip"
 
    function_name = each.value.function_name
    role          = var.lambda_role_arn
    handler       = "lambda_function.lambda_handler"  

    runtime = "python3.12"

    environment {
        variables = var.lambda_environment_variables
    }

    tags = {
        Terraform = "true"
        Name = each.value.function_name
    }

    #Lo ponemos en una vpc, no es necesario especificar la vpc con id, con las subnets y SG basta
    vpc_config  {
        subnet_ids = var.vpc_subnets_ids
        security_group_ids = var.vpc_security_group_ids
    }
    publish = false
}


resource "aws_apigatewayv2_api" "api" {
    name = var.api_gw_name
    protocol_type = "HTTP"

    #Configuramos el cors
    cors_configuration {
        allow_origins = var.allowed_origins
        allow_methods = ["*"]
        allow_headers = ["*"]
        expose_headers = ["*"]
        allow_credentials = true
        max_age = 360
    }

}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  for_each = aws_lambda_function.lambda

  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  connection_type           = "INTERNET"
  integration_method        = "POST"
  
  integration_uri           = each.value.invoke_arn
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = { for index, lambda in var.lambda_configs: lambda.function_name => lambda }

  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY ${each.value.route}/{proxy+}"
  target = "integrations/${aws_apigatewayv2_integration.lambda_integration[each.value.function_name].id}"

}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.api.id
  name   = "v1"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gw" {
    
    for_each = { for index, lambda in var.lambda_configs: lambda.function_name => lambda }

    statement_id  = "AllowExecutionFromAPIGateway"
    action        = "lambda:InvokeFunction"
    function_name = each.value.function_name
    principal     = "apigateway.amazonaws.com"

    source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*${each.value.route}/{proxy+}"
}

