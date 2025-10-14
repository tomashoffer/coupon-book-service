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

# ECS Cluster
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
