variable "lambda_role_arn" {
    description = "The role the lambda function assumes." #Va ser labrole pero necesitamos que lo pasen
    type = string
}

variable "lambda_configs" {
    description = "A list of names for the Lambda functions."
    type = list(object({
      method = string
      function_name = string
      route = string
    }))
}

variable "lambda_environment_variables" {
    description = "The environment variables to apply to lambdas."
    type = map(string)
    default = {}
}

variable "api_gw_name" {
    description = "The name for the HTTP API GW to create."
    type = string
}


variable "vpc_subnets_ids" {
    description = "The ID of the subnets where the lambdas will be in."
    type = list(string)
}

variable "vpc_security_group_ids" {
    description = "The ID of the security groups the lambdas will have."
    type = list(string)
}

variable "allowed_origins" {
    description = "Origins for CORS"
    type = list(string)
}
variable "path_to_placeholder_zip"{
    description = "The path to the code that will be in the lambda as a temporary placeholder."
}