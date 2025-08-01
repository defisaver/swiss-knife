provider "aws" {
  region = "us-west-2"
}

terraform {

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    encrypt        = true
    bucket         = "defisaver-swiss-terraform-state"
    key            = "tfstate-s3-bucket"
    region         = "us-west-2"
    dynamodb_table = "defisaver-swiss-terraform-state-lock"
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

resource "aws_dynamodb_table" "dynamodb_terraform_state_lock" {
  name           = "defisaver-swiss-terraform-state-lock"
  hash_key       = "LockID"
  read_capacity  = 20
  write_capacity = 20
  tags           = merge({ Name = "defisaver-swiss-terraform-state-lock" }, local.common_tags)
  attribute {
    name = "LockID"
    type = "S"
  }
}

data "terraform_remote_state" "general_infra" {
  backend = "s3"

  config = {
    bucket = "defisaver-terraform-state-aws"
    key    = "tfstate-s3-bucket"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "observability" {
  backend = "s3"

  config = {
    bucket = "dfs-observability-terraform-state"
    key    = "tfstate-s3-bucket"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "stage_services" {
  backend = "s3"

  config = {
    bucket = "dfs-stage-services-terraform-state"
    key    = "tfstate-s3-bucket"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "stage_networking" {
  backend = "s3"

  config = {
    bucket = "dfs-stage-networking-terraform-state"
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