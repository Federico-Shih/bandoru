##Comando para deploy de codigo
output "api_gw_endpoint" {
    description = "The endpoint that corresponds to the API GW"
    value = aws_apigatewayv2_api.api.api_endpoint
}

