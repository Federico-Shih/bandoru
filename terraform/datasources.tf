data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "aws_availability_zones" "available_azs" {
  state = "available"
}