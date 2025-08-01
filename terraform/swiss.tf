module "swiss" {

  source = "git@github.com:defisaver/ecs-terraform-module?ref=main"

  environment                      = "prod"
  cluster_id                       = data.terraform_remote_state.prod_services.outputs.web_services.arn
  security_group_ingress_cidr_list = [local.stage_subnet_cidr[1], local.stage_subnet_cidr[0]]
  load_balancer_target_arn         = data.terraform_remote_state.stage_services.outputs.alb_swiss_target_group_arn
  load_balancer_security_group_id  = data.terraform_remote_state.stage_services.outputs.alb_security_group_id
  service_name                     = "swiss"
  repository                       = "swiss"
  subnet_ids                       = [data.terraform_remote_state.stage_networking.outputs.stage_subnets.ids[0], data.terraform_remote_state.stage_networking.outputs.stage_subnets.ids[3]]
  vpc_id                           = data.terraform_remote_state.stage_networking.outputs.automation_stage_vpc.id
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

