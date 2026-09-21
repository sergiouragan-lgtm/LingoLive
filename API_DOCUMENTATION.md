# LingoLive API Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-09-20  
**Base URL:** `https://lingolive.com/api` (production) | `http://localhost:5173/api` (development)

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Security](#security)
6. [API Endpoints](#api-endpoints)
7. [Examples](#examples)

---

## Overview

LingoLive REST API provides comprehensive endpoints for managing language learning resources, user profiles, payment processing, and real-time collaboration features.

### Key Features

- **Multi-language Support**: 8 languages (EN, ES, FR, PT, IT, DE, JA, ZH)
- **Real-time Learning**: WebSocket support for live classes and tutor chat
- **AI Integration**: OpenAI-powered tutoring and content generation
- **Payment Processing**: Stripe, PayPal, and Multicaixa integration
- **Analytics**: Real-time learning progress and analytics
- **Gamification**: Achievement tracking and leaderboards
- **E-books**: Curated and user-generated e-book marketplace

---

## Authentication

All protected endpoints require Bearer token authentication using Firebase ID tokens.

### Getting a Token

```bash
# In client application using Firebase SDK
const token = await auth.currentUser?.getIdToken();
```

### Using the Token

Include the token in all API requests:

```bash
curl -H "Authorization: Bearer {idToken}" \
  https://lingolive.com/api/profile
```

### Token Validation

- Tokens are verified server-side using Firebase Admin SDK
- Invalid or expired tokens return **401 Unauthorized**
- Token scope includes user UID verification
- UID in request body is verified against token UID

### Session Management

- Tokens expire after Firebase's configured TTL (typically 1 hour)
- Refresh tokens automatically using Firebase SDK client-side
- No session cookies; stateless authentication
- User identity cannot be spoofed (UID mismatch rejected)

---

## Rate Limiting

API requests are rate-limited to prevent abuse.

### Rate Limit Tiers

| Endpoint Type | Limit | Window |
|---|---|---|
| General API | 100 requests | 15 minutes per IP |
| Authentication | 5 requests | 15 minutes per IP |
| Health Check | Unlimited | N/A |
| Static Assets | Unlimited | N/A |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1695235800
```

### Rate Limit Response

When limit exceeded (status 429):

```json
{
  "error": "Too many requests from this IP, please try again later"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|---|---|---|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | External service unavailable |

### Error Response Format

Standard error response structure:

```json
{
  "error": "Error message",
  "details": [
    {
      "path": "field.name",
      "message": "Validation message",
      "code": "error_code"
    }
  ]
}
```

### Validation Errors

When input validation fails (status 400):

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "words.0.word",
      "message": "String must contain at least 1 character(s)",
      "code": "too_small"
    },
    {
      "path": "words.0.language",
      "message": "Invalid enum value",
      "code": "invalid_enum_value"
    }
  ]
}
```

---

## Security

### Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: [comprehensive policy]
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (production)
```

### CORS Policy

CORS is enforced on all endpoints:

**Allowed Origins (Production):**
- `https://lingolive.com`
- `https://www.lingolive.com`

**Allowed Origins (Development):**
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS, PATCH

**Allowed Headers:**
- Content-Type
- Authorization

**Exposed Headers:**
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

### Input Validation

All API inputs are validated using Zod schemas:

- **Type checking**: Ensures correct data types
- **String constraints**: Length limits (min/max)
- **Array constraints**: Size limits and item validation
- **Enum validation**: Only allowed values accepted
- **Format validation**: Email, UUID, URL formats
- **Strict mode**: No extra fields allowed

### Authentication Flow

```
Client              Server
  |                   |
  |-- GET /auth/token |
  |<-- Firebase token |
  |                   |
  |-- POST /api/endpoint
  |    Authorization: Bearer {token}
  |<-- Verify token   |
  |<-- Validate input |
  |<-- Check permissions
  |<-- Execute operation
  |<-- Return response |
```

---

## API Endpoints

### Documentation

- **Interactive Docs**: `GET /api/docs` (Swagger UI)
- **OpenAPI Spec**: `GET /api/docs.json` (JSON format)

### Health & Status

#### Service Health
```
GET /api/service-health
```

Returns: `{ status: "ok" }`

### Vocabulary Management

#### Sync Vocabulary
```
POST /api/sync-vocabulary
Authorization: Bearer {idToken}
Content-Type: application/json

{
  "words": [
    {
      "word": "serendipity",
      "definition": "The occurrence of events by chance in a happy or beneficial way",
      "language": "en",
      "pronunciation": "ˌserənˈdɪpɪti",
      "exampleSentence": "It was pure serendipity that we met."
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Vocabulary synced successfully."
}
```

### User Profile

#### Get Profile
```
GET /api/profile/{userId}
Authorization: Bearer {idToken}
```

#### Update Profile
```
PUT /api/profile/{userId}
Authorization: Bearer {idToken}
Content-Type: application/json

{
  "displayName": "John Doe",
  "bio": "Language enthusiast",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "language": "en",
    "theme": "dark",
    "notifications": true
  }
}
```

### Learning Paths

#### Get Learning Path Progress
```
GET /api/learning-path/{pathId}
Authorization: Bearer {idToken}
```

#### Update Progress
```
POST /api/learning-path/progress
Authorization: Bearer {idToken}
Content-Type: application/json

{
  "pathId": "550e8400-e29b-41d4-a716-446655440000",
  "lessonId": "550e8400-e29b-41d4-a716-446655440001",
  "completionPercentage": 75,
  "timeSpentSeconds": 1200,
  "score": 85
}
```

### Payments

#### Create Payment Intent
```
POST /api/payment/create-intent
Authorization: Bearer {idToken}
Content-Type: application/json

{
  "amount": 10000,
  "currency": "USD",
  "subscriptionPlanId": "plan_123",
  "metadata": {
    "description": "Monthly Subscription"
  }
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "amount": 10000,
  "currency": "USD"
}
```

---

## Examples

### Using cURL

```bash
# Get health status
curl https://lingolive.com/api/service-health

# Sync vocabulary with authentication
curl -X POST https://lingolive.com/api/sync-vocabulary \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "words": [
      {
        "word": "eloquent",
        "definition": "Fluent or persuasive in speaking or writing",
        "language": "en"
      }
    ]
  }'

# Update user profile
curl -X PUT https://lingolive.com/api/profile/user123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane Doe",
    "preferences": {
      "theme": "dark"
    }
  }'
```

### Using JavaScript/Fetch

```javascript
// Get token from Firebase
const token = await auth.currentUser?.getIdToken();

// Sync vocabulary
const response = await fetch('/api/sync-vocabulary', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    words: [
      {
        word: 'serendipity',
        definition: 'The occurrence of events by chance',
        language: 'en'
      }
    ]
  })
});

const data = await response.json();
console.log(data); // { success: true, message: "..." }
```

### Using Python/Requests

```python
import requests

token = firebase_auth_token
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

payload = {
    'words': [
        {
            'word': 'eloquent',
            'definition': 'Fluent in speaking',
            'language': 'en'
        }
    ]
}

response = requests.post(
    'https://lingolive.com/api/sync-vocabulary',
    headers=headers,
    json=payload
)

print(response.json())
```

---

## Webhooks

### Stripe Payment Webhook

**Endpoint:** `POST /api/payment/webhook`

Receives Stripe webhook events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Signature Verification:**
```
Stripe-Signature: t=timestamp,v1=signature
```

### PayPal Webhook

**Endpoint:** `POST /api/paypal/webhook`

Receives PayPal webhook events:
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.REFUNDED`

---

## Pagination

List endpoints support pagination via query parameters:

```
GET /api/ebook?page=1&limit=20&sort=created_at&order=desc
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (default: `created_at`)
- `order` (asc | desc, default: desc)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Changelog

### Version 1.0.0 (2026-09-20)

- **Added:** OpenAPI/Swagger documentation
- **Added:** Input validation with Zod schemas
- **Added:** Security headers (CSP, HSTS, etc.)
- **Added:** CORS policy enforcement
- **Added:** Rate limiting (100 req/15min general, 5 req/15min auth)
- **Added:** Comprehensive error responses
- **Added:** Security event logging

---

## Support

For API support and questions:

- **Email:** support@lingolive.com
- **Documentation:** https://docs.lingolive.com
- **Status Page:** https://status.lingolive.com
- **GitHub Issues:** https://github.com/sergiouragan-lgtm/LingoLive/issues

---

## License

Proprietary - LingoLive Platform
