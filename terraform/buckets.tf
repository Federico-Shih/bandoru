# Bandoru S3 configuration

resource "aws_s3_bucket" "bandoru-bucket" {
  bucket = var.bandoru-bucket-name

  tags = {
    Name        = "Bandoru bucket"
  }
}

resource "aws_s3_bucket_versioning" "bandoru-versioning" {
  bucket = aws_s3_bucket.bandoru-bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "bandoru-bucket-ownership" {
  bucket = aws_s3_bucket.bandoru-bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# TODO: check if this is a problem when using presigned urls
resource "aws_s3_bucket_public_access_block" "bandoru-block-access" {
  bucket = aws_s3_bucket.bandoru-bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "bandoru-cors-config" {
  bucket = aws_s3_bucket.bandoru-bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 30
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "bandoru-lifecycle-rule" {
  bucket = aws_s3_bucket.bandoru-bucket.id
  depends_on = [aws_s3_bucket_versioning.bandoru-versioning]

  rule {
    id = "bandoru-lifecycle-rule"

    filter {}

    noncurrent_version_transition {
        noncurrent_days = 30
        storage_class = "STANDARD_IA"
    }

    transition {
        days = 60
        storage_class = "STANDARD_IA"
    }

    status = "Enabled"
  }
}

# Bucket policy no es necesario ya que LabRole da acceso.

# SPA

resource "aws_s3_bucket" "bandoru-spa" {
  bucket = var.bandoru-spa-bucket-name

  tags = {
    Name        = "Bandoru SPA bucket"
  }
}

resource "aws_s3_bucket_versioning" "bandoru-spa-versioning" {
  bucket = aws_s3_bucket.bandoru-spa.id
  versioning_configuration {
    status = "Disabled"
  }
}


resource "aws_s3_bucket_public_access_block" "allow_public_access" {
  bucket = aws_s3_bucket.bandoru-spa.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "allow_public_spa" {
  bucket = aws_s3_bucket.bandoru-spa.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "${aws_s3_bucket.bandoru-spa.arn}",
        "${aws_s3_bucket.bandoru-spa.arn}/*"
      ]
    }
  ]
}
POLICY
}

resource "aws_s3_bucket_website_configuration" "spa-website-config" {
  bucket = aws_s3_bucket.bandoru-spa.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_apigatewayv2_api" "spa-proxy" {
    name = "bandoru-spa-proxy"
    protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "spa-proxy-integration" {

  api_id           = aws_apigatewayv2_api.spa-proxy.id
  integration_type = "HTTP_PROXY"
  connection_type           = "INTERNET"
  integration_method        = "GET"

  integration_uri           = "http://${aws_s3_bucket_website_configuration.spa-website-config.website_endpoint}/" # S3 URI with path proxying
  passthrough_behavior      = "WHEN_NO_MATCH"

  request_parameters = {
    "overwrite:path" = "$request.path"
  }
}

resource "aws_apigatewayv2_route" "proxy_route" {
  api_id    = aws_apigatewayv2_api.spa-proxy.id
  route_key = "GET /{proxy+}"
  target = "integrations/${aws_apigatewayv2_integration.spa-proxy-integration.id}"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.spa-proxy.id
  name        = "$default"
  auto_deploy = true
}
