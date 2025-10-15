#!/bin/bash

# Deploy script for ECS with EC2 instances (no Docker Compose)

set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="coupon-book-service"
ECS_CLUSTER="coupon-book-cluster"
ECS_SERVICE="coupon-book-service"
ECS_TASK_DEFINITION="ecs-task-definition-ec2.json"

echo "🚀 Starting deployment to ECS..."

# 1. Build and push Docker image to ECR
echo "📦 Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Build the image
docker build -t $ECR_REPOSITORY:latest .

# Tag for ECR
docker tag $ECR_REPOSITORY:latest $ECR_REPOSITORY:latest

# Push to ECR
docker push $ECR_REPOSITORY:latest

echo "✅ Image pushed to ECR successfully"

# 2. Update ECS service
echo "🔄 Updating ECS service..."

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-task-definition --task-definition $ECS_SERVICE --query taskDefinition)

# Extract the image URI from current task definition
CURRENT_IMAGE=$(echo $CURRENT_TASK_DEF | jq -r '.containerDefinitions[0].image')

# Replace the image in task definition
NEW_IMAGE="$ECR_REPOSITORY:latest"

if [ "$CURRENT_IMAGE" != "$NEW_IMAGE" ]; then
    echo "📝 Updating task definition with new image: $NEW_IMAGE"
    
    # Create new task definition with updated image
    echo $CURRENT_TASK_DEF | jq ".containerDefinitions[0].image = \"$NEW_IMAGE\"" > new-task-definition.json
    
    # Register new task definition
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://new-task-definition.json --query taskDefinition.taskDefinitionArn --output text)
    
    echo "✅ New task definition registered: $NEW_TASK_DEF_ARN"
    
    # Update service with new task definition
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --task-definition $NEW_TASK_DEF_ARN \
        --force-new-deployment
    
    echo "✅ Service updated with new task definition"
else
    echo "ℹ️ Image is already up to date, forcing new deployment..."
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --force-new-deployment
fi

# 3. Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE

echo "🎉 Deployment completed successfully!"

# 4. Show service status
echo "📊 Service status:"
aws ecs describe-services \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --query 'services[0].{ServiceName:serviceName,Status:status,RunningCount:runningCount,PendingCount:pendingCount,DesiredCount:desiredCount}'

# 5. Show running tasks
echo "🔄 Running tasks:"
aws ecs list-tasks \
    --cluster $ECS_CLUSTER \
    --service-name $ECS_SERVICE \
    --query 'taskArns' \
    --output table

echo "✨ Deployment script completed!"
