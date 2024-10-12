terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
        version = ">= 5.71.0"
        source = "hashicorp/aws"
    }
  }  
}