module "swiss_prod" {

  source = "git@github.com:defisaver/ecs-terraform-module?ref=main"

  environment                      = "prod"
  cluster_id                       = data.terraform_remote_state.prod_services.outputs.web_services.arn
  security_group_ingress_cidr_list = data.terraform_remote_state.prod_networking.outputs.web_services_vpc.private_subnets_cidr_blocks
  load_balancer_target_arn         = data.terraform_remote_state.prod_services.outputs.alb_swiss_target_group_arn
  load_balancer_security_group_id  = data.terraform_remote_state.prod_services.outputs.alb_security_group_id
  service_name                     = "swiss-prod"
  repository                       = "swiss"
  subnet_ids                       = data.terraform_remote_state.prod_networking.outputs.web_services_vpc.private_subnets
  vpc_id                           = data.terraform_remote_state.prod_networking.outputs.web_services_vpc.vpc_id
  datadog_enabled                  = false
  datadog_monitoring_secret_arn    = data.terraform_remote_state.observability.outputs.datadog_api_key_arn
  datadog_agent_version            = "7.42.2"
  datadog_team_tag                 = "front"
  load_balancer_container_port     = 3000

  port_mappings = [
    {
      containerPort = 3000
      hostPort      = 3000
      protocol      = "tcp"
    }
  ]

  service_cpu    = 256
  service_memory = 512

  desired_count = 1

  deployment_image_tag = var.deployment_image_tag
}

