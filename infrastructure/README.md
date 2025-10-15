# 🏗️ AWS Infrastructure for Coupon Book Service

Esta infraestructura está diseñada según las recomendaciones de Carlos y sigue las mejores prácticas de AWS para alta disponibilidad y escalabilidad.

## 📋 Componentes de la Arquitectura

### 🌐 **Networking**
- **VPC** con subnets públicas y privadas
- **Public Subnets**: Para ALB y NAT Gateway
- **Private Subnets**: Para ECS, RDS y Redis
- **Security Groups**: Configurados con reglas específicas

### 🖥️ **Compute Layer**
- **ECS Cluster (EC2)**: Instancias EC2 gestionadas por ECS
- **Auto Scaling Group**: Escalado automático basado en CPU/Memory
- **Capacity Provider**: Gestión automática de instancias EC2

### 🗄️ **Database Layer**
- **RDS PostgreSQL**: Multi-AZ para alta disponibilidad
- **Read Replicas**: Para operaciones de lectura
- **Backups**: Automáticos con 7 días de retención

### 🚀 **Caching Layer**
- **ElastiCache Redis**: Cluster con Multi-AZ
- **Encryption**: En tránsito y en reposo
- **Backups**: Automáticos

### 📁 **Storage**
- **S3 Bucket**: Para assets y archivos
- **Versioning**: Habilitado
- **Encryption**: AES256

### 🌍 **DNS & Load Balancing**
- **Route53**: Gestión de DNS
- **Application Load Balancer**: Distribución de tráfico
- **Health Checks**: Configurados

### 📊 **Monitoring & Logging**
- **CloudWatch**: Métricas, logs y alertas
- **SNS**: Notificaciones de alertas
- **Dashboard**: Visualización de métricas

## 🚀 Despliegue

### **Prerequisitos**
```bash
# Instalar herramientas necesarias
npm install -g @aws/cli
npm install -g terraform

# Configurar AWS CLI
aws configure
```

### **1. Configurar Variables**
```bash
# Crear archivo terraform.tfvars
cat > terraform.tfvars << EOF
aws_region    = "us-east-1"
environment   = "production"
db_password   = "your-secure-password"
domain_name   = "your-domain.com"
alert_email   = "admin@your-domain.com"
EOF
```

### **2. Desplegar Infraestructura**
```bash
cd infrastructure

# Inicializar Terraform
terraform init

# Planificar cambios
terraform plan

# Aplicar cambios
terraform apply
```

### **3. Configurar Secrets Manager**
```bash
# Crear secretos en AWS Secrets Manager
aws secretsmanager create-secret \
    --name "coupon-book/db-url" \
    --description "Database connection URL" \
    --secret-string "postgresql://username:password@rds-endpoint:5432/couponbook"

aws secretsmanager create-secret \
    --name "coupon-book/jwt-private" \
    --description "JWT Private Key" \
    --secret-string "your-base64-encoded-private-key"

aws secretsmanager create-secret \
    --name "coupon-book/jwt-public" \
    --description "JWT Public Key" \
    --secret-string "your-base64-encoded-public-key"

aws secretsmanager create-secret \
    --name "coupon-book/google-client-id" \
    --description "Google OAuth Client ID" \
    --secret-string "your-google-client-id"

aws secretsmanager create-secret \
    --name "coupon-book/google-client-secret" \
    --description "Google OAuth Client Secret" \
    --secret-string "your-google-client-secret"

aws secretsmanager create-secret \
    --name "coupon-book/s3-bucket" \
    --description "S3 Bucket Name" \
    --secret-string "your-s3-bucket-name"

aws secretsmanager create-secret \
    --name "coupon-book/redis-url" \
    --description "Redis Connection URL" \
    --secret-string "redis://your-redis-endpoint:6379"
```

### **4. Desplegar Aplicación**
```bash
# Hacer el script ejecutable
chmod +x scripts/deploy-ecs.sh

# Ejecutar despliegue
./scripts/deploy-ecs.sh
```

## 📊 Monitoreo

### **CloudWatch Dashboard**
- Accede al dashboard en: AWS Console > CloudWatch > Dashboards > CouponBookService
- Métricas disponibles:
  - ECS Service (CPU, Memory)
  - RDS Database (CPU, Connections)
  - Redis Cache (CPU, Connections)
  - Load Balancer (Requests, Errors)

### **Alertas Configuradas**
- **CPU Alto**: > 80% por 10 minutos
- **Memory Alto**: > 85% por 10 minutos
- **DB Connections**: > 80 por 10 minutos
- **Redis CPU**: > 80% por 10 minutos
- **Error Rate**: > 10 errores 5xx por 5 minutos

## 🔧 Configuración de la Aplicación

### **Variables de Entorno Requeridas**
```bash
NODE_ENV=production
PORT=4000
AWS_REGION=us-east-1
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_BUCKET_NAME=coupon-book-assets-...
JWT_PRIVATE_KEY_BASE64=...
JWT_PUBLIC_KEY_BASE64=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 💰 Estimación de Costos (Mensual)

| **Servicio** | **Configuración** | **Costo Estimado** |
|--------------|-------------------|-------------------|
| ECS EC2 Instances (3x t3.medium) | 24/7 | $120 |
| RDS PostgreSQL (db.t3.medium Multi-AZ) | 24/7 | $80 |
| ElastiCache Redis (cache.t3.micro) | 24/7 | $15 |
| Application Load Balancer | 2 AZs | $20 |
| S3 Storage (100GB) | Standard | $3 |
| CloudWatch (Logs + Metrics) | 30 days | $15 |
| Route53 Hosted Zone | 1 zone | $1 |
| **Total Estimado** | | **~$254/mes** |

## 🛡️ Seguridad

### **Implementado**
- ✅ VPC con subnets privadas
- ✅ Security Groups restrictivos
- ✅ Secrets Manager para credenciales
- ✅ Encriptación en tránsito y reposo
- ✅ IAM roles con permisos mínimos

### **Recomendaciones Adicionales**
- 🔐 WAF para protección web
- 🔍 GuardDuty para detección de amenazas
- 📋 Config para compliance
- 🔒 Certificate Manager para SSL

## 📞 Soporte

Para cualquier problema con la infraestructura:
1. Revisar logs en CloudWatch
2. Verificar alertas en SNS
3. Consultar métricas en el dashboard
4. Contactar al equipo de DevOps

---

**¡Infraestructura lista para producción!** 🚀
