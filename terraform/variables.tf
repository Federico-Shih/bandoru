variable "bandoru-bucket-name" {
  type = string
}

variable "bandoru-spa-bucket-name" {
  type = string
}

variable "google_idp_client_id" {
  type = string
}

variable "google_idp_client_secret" {
  type = string
}

variable "cognito-domain" {
  type = string
}

variable "allowed_localhost_url" {
  type = string
}

variable "aws-profile" {
  type = string
}

variable "allowed-cognito-callback-url" {
  type = list(string)
}
