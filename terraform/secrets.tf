variable "secrets_manager" {
  description = "Secrets backend (aws|gcp|azure|local)"
  type        = string
  default     = "aws"
}

# Example: AWS Secrets Manager stubs
resource "aws_secretsmanager_secret" "app" {
  name        = "${var.project_name}/${var.environment}/app"
  description = "Application secrets"
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id     = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    JWT_SECRET        = "YOUR_JWT_SECRET",
    OPENAI_API_KEY    = "YOUR_API_KEY",
    MINIO_ACCESS_KEY  = "minioadmin",
    MINIO_SECRET_KEY  = "minioadmin",
  })
}

output "secrets_arn" {
  value = aws_secretsmanager_secret.app.arn
}

