# 📋 COUPON BOOK SERVICE - POSTMAN COLLECTION

## 🔐 AUTHENTICATION ENDPOINTS

### 1. Register Business User
```http
POST http://localhost:3001/auth/register
Content-Type: application/json
```
**Body:**
```json
{
  "email": "business@example.com",
  "password": "Password123!",
  "first_name": "Business",
  "last_name": "Owner",
  "role": "BUSINESS"
}
```

### 2. Register Customer User
```http
POST http://localhost:3001/auth/register
Content-Type: application/json
```
**Body:**
```json
{
  "email": "customer@example.com",
  "password": "Password123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "CUSTOMER"
}
```

### 3. Login
```http
POST http://localhost:3001/auth/login
Content-Type: application/json
```
**Body:**
```json
{
  "email": "business@example.com",
  "password": "Password123!"
}
```
**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "business@example.com",
    "role": "BUSINESS",
    "first_name": "Business",
    "last_name": "Owner"
  },
  "token": {
    "expiresIn": 604800,
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Get Current User
```http
GET http://localhost:3001/auth/me
Authorization: Bearer {accessToken}
```

---

## 📚 COUPON BOOKS ENDPOINTS

### 5A. Create Coupon Book (Empty - Manual Codes Later)
```http
POST http://localhost:4000/coupons
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Summer Sale 2025",
  "description": "Special summer discounts for our customers",
  "maxCodesPerUser": 3,
  "allowMultipleRedemptions": false,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```
**Response:** Coupon book with `status: "DRAFT"` and `totalCodes: 0`

### 5B. Create Coupon Book (Auto-Generate Codes)
```http
POST http://localhost:4000/coupons
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Summer Sale 2025",
  "description": "Special summer discounts",
  "maxCodesPerUser": 3,
  "allowMultipleRedemptions": false,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "autoGenerateCodes": {
    "pattern": "SUMMER-{RANDOM}",
    "count": 100,
    "length": 8
  }
}
```
**Pattern Options:**
- `SUMMER-{RANDOM}` → `SUMMER-Ab3K9mXy` (random alphanumeric)
- `PROMO-{UUID}` → `PROMO-a1b2c3d4` (short UUID, very unique)
- `SALE-{NUM}` → `SALE-12345678` (numeric only)
- `CODE-{ALPHA}` → `CODE-AbCdEfGh` (alphabetic only)
- `MIX-{RANDOM}-{NUM}` → `MIX-Ab3K9m-123456`

**Response:** Coupon book with `status: "ACTIVE"` and `totalCodes: 100` with codes already generated!

### 6. Upload Codes
```http
POST http://localhost:4000/coupons/codes
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "couponBookId": "uuid-of-coupon-book",
  "codes": [
    "SUMMER2025-001",
    "SUMMER2025-002",
    "SUMMER2025-003",
    "SUMMER2025-004",
    "SUMMER2025-005"
  ]
}
```

### 7. Generate Codes with Pattern
```http
POST http://localhost:4000/coupons/codes/generate
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "couponBookId": "uuid-of-coupon-book",
  "pattern": "PROMO-{RANDOM}-{NUM}",
  "totalCodes": 10,
  "randomLength": 6
}
```
**Pattern Examples:**
- `SUMMER-{RANDOM}` → `SUMMER-Ab3K9m`
- `CODE-{NUM}` → `CODE-123456`
- `PROMO-{RANDOM}-{NUM}` → `PROMO-Xy7Z2k-987654`

### 8. Get Coupon Book Details
```http
GET http://localhost:3001/coupon-books/{couponBookId}
Authorization: Bearer {businessToken}
```

### 9. Get Coupon Book Statistics
```http
GET http://localhost:3001/coupon-books/{couponBookId}/stats
Authorization: Bearer {businessToken}
```

---

## 🎁 ASSIGNMENT ENDPOINTS

### 10. Assign Random Coupon
```http
POST http://localhost:4000/coupons/assign
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "couponBookId": "uuid-of-coupon-book",
  "userId": "customer-user-id-here"
}
```
**Note:** `userId` is optional. If not provided, assigns to authenticated user.

### 11. Assign Specific Coupon
```http
POST http://localhost:4000/coupons/assign/{couponCode}
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "userId": "customer-user-id-here"
}
```

---

## 🔒 COUPON OPERATIONS

### 12. Lock Coupon (Optional before redeeming)
```http
POST http://localhost:4000/coupons/lock/{couponCode}
Authorization: Bearer {customerToken}
Content-Type: application/json
```
**Body:**
```json
{
  "userId": "customer-user-id-here"
}
```

### 13. Redeem Coupon
```http
POST http://localhost:4000/coupons/redeem/{couponCode}
Authorization: Bearer {businessToken}
Content-Type: application/json
```
**Body:**
```json
{
  "userId": "customer-user-id-here",
  "metadata": {
    "location": "Store Downtown",
    "cashier": "John Doe",
    "transactionId": "TXN-123456",
    "discount": "20%",
    "orderId": "order-456"
  }
}
```
**Note:** `userId` is optional. If not provided, uses authenticated user. Only BUSINESS/ADMIN can redeem coupons.

### 14. Get My Coupons
```http
GET http://localhost:3001/coupon-books/my-coupons
Authorization: Bearer {customerToken}
```

---

## 🔄 COMPLETE TEST FLOW

### Step 1: Setup
1. Register BUSINESS user → Get ID
2. Register CUSTOMER user → Get ID
3. Login as BUSINESS → Save `businessToken`
4. Login as CUSTOMER → Save `customerToken`

### Step 2: Create Campaign (as BUSINESS)
1. Create Coupon Book → Save `couponBookId`
2. Generate 10 codes OR Upload custom codes
3. Get coupon book stats to verify

### Step 3: Assign Coupons (as BUSINESS)
1. Assign random coupon to CUSTOMER
2. Copy the `code` from response

### Step 4: Redeem (as CUSTOMER)
1. (Optional) Lock the coupon first
2. Redeem the coupon with metadata
3. Verify in "My Coupons"

### Step 5: Verify
1. As CUSTOMER: Check my coupons list
2. As BUSINESS: Check coupon book statistics

---

## 📝 POSTMAN ENVIRONMENT VARIABLES

Create these variables in Postman:

```javascript
{
  "baseUrl": "http://localhost:3001",
  "businessToken": "", // Set after business login
  "customerToken": "", // Set after customer login
  "couponBookId": "", // Set after creating coupon book
  "businessUserId": "", // Set after business registration
  "customerUserId": "", // Set after customer registration
  "testCouponCode": "" // Set after assignment
}
```

---

## 🎯 QUICK TEST SCRIPT

Use this in Postman Tests tab to auto-save variables:

```javascript
// For Register endpoint
if (pm.response.code === 200 && pm.request.url.toString().includes('/register')) {
    const response = pm.response.json();
    if (pm.request.body.raw.includes('BUSINESS')) {
        pm.environment.set('businessEmail', response.email);
    } else {
        pm.environment.set('customerEmail', response.email);
    }
}

// For Login endpoint
if (pm.response.code === 200 && pm.request.url.toString().includes('/login')) {
    const response = pm.response.json();
    const token = response.token.accessToken;
    const userId = response.user.id;
    
    if (response.user.role === 'BUSINESS') {
        pm.environment.set('businessToken', token);
        pm.environment.set('businessUserId', userId);
    } else {
        pm.environment.set('customerToken', token);
        pm.environment.set('customerUserId', userId);
    }
}

// For Create Coupon Book
if (pm.response.code === 201 && pm.request.url.toString().includes('/coupon-books')) {
    const response = pm.response.json();
    pm.environment.set('couponBookId', response.id);
}

// For Assign Coupon
if (pm.response.code === 201 && pm.request.url.toString().includes('/assign')) {
    const response = pm.response.json();
    pm.environment.set('testCouponCode', response.couponCode.code);
}
```

---

## ⚠️ REMOVED ENDPOINTS (Not needed for Coupon Service)

The following endpoints from the original receptionistAI were removed:
- ❌ `POST /auth/guest-login` - No guest users in coupon service
- ❌ Guest cookie handling in registration
- ❌ Autogestion-specific validation logic
- ❌ Voice interaction endpoints
- ❌ Appointment scheduling endpoints

---

## 🚀 Ready to Test!

1. Import this collection into Postman
2. Set up environment variables
3. Run the complete test flow
4. Check Swagger docs at `http://localhost:3001/api`
