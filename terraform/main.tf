module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.13.0"

  name = "bandoru-vpc"
  cidr = "10.0.0.0/16"

  azs = ["us-east-1a", "us-east-1b"]

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

  # # cosas para RDS que vamos a sacar:
  # database_subnets = ["10.0.30.0/24", "10.0.40.0/24"]
  # create_database_subnet_group = true
  # database_subnet_group_name = "rds_subnet_group"
  # database_subnet_names = ["rds_subnet_1", "rds_subnet_2"]
  # create_database_subnet_route_table = true

}

# RDS
# resource "aws_security_group" "bandoru_db_sg" {
#   name = "bandoru-db-sg"
#   vpc_id = module.vpc.vpc_id
#   ingress {
#     from_port   = 5432
#     to_port     = 5432
#     protocol    = "tcp"
#     cidr_blocks = ["10.0.0.0/16"]
#   }
#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
#   tags = {
#     Name = "bandoru-db-sg"
#   }
# }

# resource "aws_db_instance" "bandoru_db" {
#   allocated_storage    = 20
#   engine               = "postgres"
#   auto_minor_version_upgrade = true
#   engine_version       = "16.3"
#   instance_class       = "db.t4g.micro"
#   identifier           = "bandoru-db"
#   username             = "postgres"
#   password             = "lechugapasion"
#   db_subnet_group_name = module.vpc.database_subnet_group
#   vpc_security_group_ids = [aws_security_group.bandoru_db_sg.id]
#   skip_final_snapshot  = true
#   publicly_accessible  = false
#   availability_zone    = "us-east-1a"
#   apply_immediately = true
#
#
#   tags = {
#     Name = "bandoru-db"
#   }
# }


# route table, lambda-route-table
# route table, rds-route-table

# Endpoints > Create Endpoint
# Name Tag = 's3-endpoint'
# Service category = AWS service
# Services = com.amazonaws.us-east-1.s3 -> Gateway
# VPC = bandoru
# Route tables = 'lambda-route-table'
# Policy = Full access

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  #Depende de la vpc
  depends_on = [
    module.vpc
  ]

  route_table_ids = module.vpc.intra_route_table_ids
  tags = {
    Terraform   = "true"
    Environment = "s3-endpoint"
  }
}
resource "aws_vpc_endpoint_policy" "s3_endpoint_policy" {
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
  #Policy no ponemos porque defaultea a Full Access
}
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"

  #Depende de la vpc
  depends_on = [
    module.vpc
  ]

  route_table_ids = module.vpc.intra_route_table_ids
  tags = {
    Terraform   = "true"
    Environment = "dynamodb-endpoint"
  }
  #Que onda con la policy
}
resource "aws_vpc_endpoint_policy" "dynamodb_endpoint_policy" {
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
  #Policy no ponemos porque defaultea a Full Access
}



# Route table subnet assoc lambda-route-table -> lambda-1a, lambda-1b

# Route table subnet rds-route-table -> rds-1a

# Module para levantar multiples lambdas

# API Gateway

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
  ]

  #TODO: Add other env variables
  lambda_environment_variables = zipmap(
    ["S3_BUCKET", "USER_POOL_ID", "APP_CLIENT_ID", "DB_TABLE", "DB_USER_IDX"],
    [aws_s3_bucket.bandoru-bucket.id, aws_cognito_user_pool.pool.id, aws_cognito_user_pool_client.default-client.id, var.dynamodb-table-name, var.dynamodb-user-idx]
  )
  api_gw_name             = "bandoru-api"
  vpc_subnets_ids         = module.vpc.private_subnets
  vpc_security_group_ids  = [aws_security_group.bandoru_lambda_sg.id]
  allowed_origins         = ["http://${aws_s3_bucket_website_configuration.spa-website-config.website_endpoint}", aws_apigatewayv2_api.spa-proxy.api_endpoint]
  path_to_placeholder_zip = "${abspath(path.root)}/hello.zip"
}
