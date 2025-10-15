# Terraform configuration for AWS infrastructure

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "coupon-book-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "coupon-book-service"
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "coupon_book" {
  name       = "coupon-book-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
  
  tags = {
    Name = "Coupon Book DB subnet group"
  }
}

resource "aws_db_instance" "coupon_book" {
  identifier = "coupon-book-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "couponbook"
  username = "couponbook_admin"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.coupon_book.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "coupon-book-db-final-snapshot"
  
  performance_insights_enabled = true
  
  tags = {
    Name = "coupon-book-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "coupon_book" {
  name       = "coupon-book-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "coupon_book" {
  replication_group_id       = "coupon-book-cache"
  description                = "Redis cluster for coupon book service"
  
  node_type                  = "cache.t3.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.coupon_book.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  snapshot_retention_limit = 5
  snapshot_window         = "02:00-03:00"
  
  tags = {
    Name = "coupon-book-redis"
  }
}

# ECS Cluster with EC2 instances
resource "aws_ecs_cluster" "coupon_book" {
  name = "coupon-book-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "coupon-book-ecs-cluster"
  }
}

# Launch Template for EC2 instances
resource "aws_launch_template" "coupon_book" {
  name_prefix   = "coupon-book-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  
  vpc_security_group_ids = [aws_security_group.ecs.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }
  
  user_data = base64encode(templatefile("${path.module}/ecs_user_data.sh", {
    cluster_name = aws_ecs_cluster.coupon_book.name
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "coupon-book-ecs-instance"
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "coupon_book" {
  name                = "coupon-book-asg"
  vpc_zone_identifier = module.vpc.private_subnets
  target_group_arns   = [aws_lb_target_group.coupon_book.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = 2
  max_size         = 10
  desired_capacity = 3
  
  launch_template {
    id      = aws_launch_template.coupon_book.id
    version = "$Latest"
  }
  
  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = false
  }
}

# ECS Capacity Provider
resource "aws_ecs_capacity_provider" "coupon_book" {
  name = "coupon-book-cp"
  
  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.coupon_book.arn
    managed_termination_protection = "ENABLED"
    
    managed_scaling {
      maximum_scaling_step_size = 2
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 80
    }
  }
}

# Associate capacity provider with cluster
resource "aws_ecs_cluster_capacity_providers" "coupon_book" {
  cluster_name = aws_ecs_cluster.coupon_book.name
  
  capacity_providers = [aws_ecs_capacity_provider.coupon_book.name]
  
  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = aws_ecs_capacity_provider.coupon_book.name
  }
}

# Application Load Balancer
resource "aws_lb" "coupon_book" {
  name               = "coupon-book-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = false
  
  tags = {
    Name = "coupon-book-alb"
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "coupon-book-alb-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "coupon-book-alb-sg"
  }
}

resource "aws_security_group" "ecs" {
  name_prefix = "coupon-book-ecs-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "coupon-book-ecs-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "coupon-book-rds-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
  
  tags = {
    Name = "coupon-book-rds-sg"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "coupon-book-redis-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
  
  tags = {
    Name = "coupon-book-redis-sg"
  }
}

# S3 Bucket for assets and files
resource "aws_s3_bucket" "coupon_book_assets" {
  bucket = "coupon-book-assets-${random_string.bucket_suffix.result}"
  
  tags = {
    Name        = "Coupon Book Assets"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "coupon_book_assets" {
  bucket = aws_s3_bucket.coupon_book_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "coupon_book_assets" {
  bucket = aws_s3_bucket.coupon_book_assets.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "coupon_book_assets" {
  bucket = aws_s3_bucket.coupon_book_assets.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Route53 Hosted Zone
resource "aws_route53_zone" "coupon_book" {
  name = var.domain_name
  
  tags = {
    Name = "coupon-book-zone"
  }
}

resource "aws_route53_record" "coupon_book" {
  zone_id = aws_route53_zone.coupon_book.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.coupon_book.dns_name
    zone_id                = aws_lb.coupon_book.zone_id
    evaluate_target_health = true
  }
}

# IAM Role for ECS Instance Profile
resource "aws_iam_role" "ecs_instance_role" {
  name = "coupon-book-ecs-instance-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role_policy" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "coupon-book-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "coupon_book" {
  name              = "/ecs/coupon-book-service"
  retention_in_days = 30
  
  tags = {
    Name = "coupon-book-logs"
  }
}

# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Random string for bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "coupon-book.example.com"
}
