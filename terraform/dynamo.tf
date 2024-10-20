module "dynamodb_table" {
  source   = "terraform-aws-modules/dynamodb-table/aws"

  name             = "BandoruTable"
  hash_key         = "PK"
  range_key        = "SK"


  attributes = [
    {
      name = "PK"
      type = "S"
    },
    {
      name = "SK"
      type = "S"
    },
    {
      name = "GSI1PK" # "USER#user_id"
      type = "S"
    },
    {
      name = "GSI1SK" # "BANDORU#bandoru_id"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name               = "bandoru-by-user"
      hash_key           = "GSI1PK"
      range_key          = "GSI1SK"
      projection_type    = "ALL"
    }
  ]
  tags = {
    Terraform = "true"
  }
}