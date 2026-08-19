provider "aws" {
  region = "us-west-2"
}

terraform {
  required_version = "~> 1.15.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60.0"
    }
  }

  backend "s3" {
    encrypt      = true
    bucket       = "defisaver-swiss-terraform-state"
    key          = "tfstate-s3-bucket"
    region       = "us-west-2"
    use_lockfile = true
  }
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "defisaver-swiss-terraform-state"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state_versioning_block" {
  bucket              = aws_s3_bucket.terraform_state.id
  block_public_policy = true
}

data "terraform_remote_state" "observability" {
  backend = "s3"

  config = {
    bucket = "dfs-observability-terraform-state"
    key    = "tfstate-s3-bucket"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "prod_services" {
  backend = "s3"

  config = {
    bucket = "dfs-prod-services-terraform-state"
    key    = "tfstate-s3-bucket"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "prod_networking" {
  backend = "s3"

  config = {
    bucket = "dfs-prod-networking-terraform-state"
    key    = "tfstate-s3-bucket"
    region = "us-west-2"
  }
}