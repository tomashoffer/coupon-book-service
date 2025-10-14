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

### Coupon Books
- `POST /coupon-books` - Create a new coupon book
- `GET /coupon-books/:id` - Get coupon book details
- `GET /coupon-books/:id/stats` - Get coupon book statistics

### Code Management
- `POST /coupon-books/:id/codes/upload` - Upload custom codes
- `POST /coupon-books/:id/codes/generate` - Generate codes with patterns

### Assignment
- `POST /coupon-books/:id/assign/random` - Assign random coupon to user
- `POST /coupon-books/assign/:code` - Assign specific coupon to user

### Redemption
- `POST /coupon-books/lock/:code` - Lock coupon temporarily
- `POST /coupon-books/redeem/:code` - Redeem coupon permanently

### User Operations
- `GET /coupon-books/my-coupons` - Get user's assigned coupons

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

Example: `SUMMER-{RANDOM}-{NUM}` → `SUMMER-Ab3K9m-123456`

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

### Production Considerations
- Use environment-specific configurations
- Set up proper logging and monitoring
- Configure SSL/TLS certificates
- Set up database backups
- Use process managers (PM2)

### Cloud Deployment
- **AWS**: ECS with RDS PostgreSQL
- **GCP**: Cloud Run with Cloud SQL
- **Azure**: Container Instances with Azure Database

## 📝 License

This project is licensed under the UNLICENSED License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For questions or issues, please create an issue in the repository.
