locals {
  common_tags = {
    "Team"       = "SRE"
    "Repository" = "defisaver/infrastructure"
  }

  common_tags_prod = {
    "Team"        = "SRE"
    "Repository"  = "defisaver/infrastructure"
    "Environment" = "prod"
  }
}