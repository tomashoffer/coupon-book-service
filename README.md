# Coupon Book Service API

A comprehensive API service for managing coupon books, codes, assignments, and redemptions with full concurrency control and audit trails.

## 🚀 Features

### Core Functionality
- **Coupon Book Management**: Create and manage coupon campaigns
- **Code Generation**: Upload custom codes or generate them automatically with patterns
- **User Assignment**: Assign coupons randomly or to specific users
- **Redemption System**: Secure coupon redemption with locking mechanism
- **Multiple Redemptions**: Support for reusable coupons per user

### Technical Features
- **Concurrency Control**: Row-level locking and ACID transactions
- **Audit Trail**: Complete history of assignments and redemptions
- **Role-Based Access**: BUSINESS, CUSTOMER, and ADMIN roles
- **JWT Authentication**: Secure API access with Google OAuth support
- **Swagger Documentation**: Interactive API documentation

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - Register new user (BUSINESS, CUSTOMER, ADMIN)
- `POST /auth/login` - Login with email/password
- `GET /auth/me` - Get current authenticated user
- `GET /auth/google` - Login with Google OAuth

### Coupon Books
- `POST /coupons` - Create a new coupon book
- `GET /coupons/:id` - Get coupon book details

### Code Management
- `POST /coupons/codes` - Upload custom codes to existing book
- `POST /coupons/codes/generate` - Generate codes automatically with patterns

### Assignment
- `POST /coupons/assign` - Assign random coupon to user
- `POST /coupons/assign/:code` - Assign specific coupon to user

### Redemption
- `POST /coupons/lock/:code` - Lock coupon temporarily (24h)
- `POST /coupons/unlock/:code` - Unlock a locked coupon
- `POST /coupons/redeem/:code` - Redeem coupon permanently

### User Operations
- `GET /coupons/my-assigned-coupons` - Get user's assigned coupons

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd coupon-book-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Set up PostgreSQL database**
```bash
# Create database
createdb coupon_book_service

# Run migrations
npm run migration:run
```

5. **Start the application**
```bash
npm run start:dev
```

### Docker Deployment

1. **Start with Docker Compose**
```bash
docker-compose up -d
```

2. **Run migrations**
```bash
docker-compose exec app npm run migration:run
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `POSTGRES_USER` | Database user | postgres |
| `POSTGRES_PASSWORD` | Database password | password |
| `POSTGRES_DB` | Database name | coupon_book_service |
| `JWT_EXPIRATION_TIME` | JWT token expiration (days) | 7 |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | http://localhost:3000 |
| `PORT` | Server port | 4000 |

### Code Generation Patterns

Use placeholders in your patterns:
- `{RANDOM}` - Random alphanumeric string
- `{NUM}` - Random numeric string
- `{ALPHA}` - Random alphabetic string
- `{UUID}` - Short UUID (very unique)

**Examples:**
```
SUMMER-{RANDOM}     → SUMMER-Ab3K9mXy
DISCOUNT-{NUM}      → DISCOUNT-12345678
VIP-{ALPHA}         → VIP-AbCdEfGh
SPECIAL-{UUID}      → SPECIAL-a1b2c3d4
SALE-{RANDOM}-{NUM} → SALE-Xy9K2m-456789
```

## 📊 Database Schema

### Core Tables
- **coupon_books** - Campaign configuration and rules
- **coupon_codes** - Individual coupon codes with states
- **coupon_assignments** - User-coupon assignment history
- **coupon_redemptions** - Redemption audit trail

### States
- **AVAILABLE** - Code ready for assignment
- **ASSIGNED** - Code assigned to user
- **LOCKED** - Temporarily locked during redemption
- **REDEEMED** - Permanently redeemed
- **EXPIRED** - Code expired

## 🔒 Security Features

- **JWT Authentication** with role-based access control
- **Row-level locking** prevents race conditions
- **ACID transactions** ensure data consistency
- **Input validation** with class-validator
- **SQL injection protection** with TypeORM

## 📚 API Documentation

Once running, visit: `http://localhost:4000/api` for interactive Swagger documentation.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app npm run migration:run

# View logs
docker-compose logs -f app
```

### AWS Deployment (Production)

This project includes complete AWS infrastructure as code:

**Services Used:**
- **ECS (EC2)** - Container orchestration
- **RDS PostgreSQL** - Database with Multi-AZ
- **ElastiCache Redis** - Caching layer
- **ALB** - Load balancing
- **Route 53** - DNS management
- **CloudWatch** - Monitoring and logging
- **S3** - File storage

**Deploy Steps:**
```bash
# Configure AWS credentials
aws configure

# Initialize Terraform
cd infrastructure
terraform init

# Deploy infrastructure
terraform apply

# Deploy application
./scripts/deploy-ecs.sh
```

See `infrastructure/README.md` for detailed deployment instructions.

## 🎯 Quick Start Example

```bash
# 1. Register a business user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"business@test.com","password":"Pass123!","role":"BUSINESS"}'

# 2. Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"business@test.com","password":"Pass123!"}'

# 3. Create coupon book with auto-generated codes
curl -X POST http://localhost:4000/coupons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "maxCodesPerUser": 3,
    "allowMultipleRedemptions": false,
    "autoGenerateCodes": {
      "pattern": "SUMMER-{RANDOM}",
      "count": 100,
      "length": 8
    }
  }'

# 4. Assign random coupon
curl -X POST http://localhost:4000/coupons/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"couponBookId":"YOUR_BOOK_ID"}'
```

## 📖 Documentation

- **Swagger UI**: http://localhost:4000/api
- **Architecture**: See `infrastructure/README.md`
- **Postman Collection**: Available in project root

## 🔑 Key Features Explained

### Lock Mechanism
Coupons can be **temporarily locked** for 24 hours before redemption:
```
ASSIGNED → LOCKED (24h) → REDEEMED
```

Only the user who locked the coupon can redeem it. Locks expire automatically and are cleaned up every 5 minutes.

### Multiple Redemptions
Enable `allowMultipleRedemptions: true` to allow the same coupon to be redeemed multiple times:
```
LOCKED → REDEEMED → ASSIGNED (ready to use again)
```

### Concurrency Control
All critical operations use:
- **ACID Transactions** - All-or-nothing operations
- **Pessimistic Locks** - Row-level locking with `FOR UPDATE`
- **State Validation** - Only valid state transitions allowed

## 📝 License

This project is licensed under the UNLICENSED License.

## 📞 Support

For questions or issues, please create an issue in the repository.
