# CloudWatch Alarms for monitoring

# High CPU utilization alarm
resource "aws_cloudwatch_metric_alarm" "high_cpu_utilization" {
  alarm_name          = "coupon-book-high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ServiceName = aws_ecs_service.coupon_book.name
    ClusterName = aws_ecs_cluster.coupon_book.name
  }
  
  tags = {
    Name = "coupon-book-high-cpu"
  }
}

# High memory utilization alarm
resource "aws_cloudwatch_metric_alarm" "high_memory_utilization" {
  alarm_name          = "coupon-book-high-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ServiceName = aws_ecs_service.coupon_book.name
    ClusterName = aws_ecs_cluster.coupon_book.name
  }
  
  tags = {
    Name = "coupon-book-high-memory"
  }
}

# Database connection alarm
resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "coupon-book-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.coupon_book.identifier
  }
  
  tags = {
    Name = "coupon-book-database-connections"
  }
}

# Redis CPU alarm
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "coupon-book-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.coupon_book.id
  }
  
  tags = {
    Name = "coupon-book-redis-cpu"
  }
}

# Application error rate alarm
resource "aws_cloudwatch_metric_alarm" "application_error_rate" {
  alarm_name          = "coupon-book-application-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors application error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = aws_lb.coupon_book.arn_suffix
  }
  
  tags = {
    Name = "coupon-book-application-error-rate"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "coupon-book-alerts"
  
  tags = {
    Name = "coupon-book-alerts"
  }
}

# SNS Topic subscription (replace with your email)
resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "coupon_book" {
  dashboard_name = "CouponBookService"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.coupon_book.name, "ClusterName", aws_ecs_cluster.coupon_book.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.coupon_book.identifier],
            [".", "DatabaseConnections", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", aws_elasticache_replication_group.coupon_book.id],
            [".", "CurrConnections", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Redis Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.coupon_book.arn_suffix],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Load Balancer Metrics"
          period  = 300
        }
      }
    ]
  })
}

# Variable for alert email
variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "admin@example.com"
}
