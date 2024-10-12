##Comando para deploy de codigo

output "command_to_deploy" {
    description  = "The command to run in order to deploy the code to the instance"
    value =  [ for lambda in aws_lambda_function.lambda:"aws lambda update-function-code --function-name ${lambda.function_name} --zip-file path/to/zip-file"]
}

