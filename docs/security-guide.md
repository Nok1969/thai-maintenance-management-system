# Security Implementation Guide

## Overview

This document describes the comprehensive security measures implemented in the maintenance management system.

## Security Features Implemented

### 1. Rate Limiting

#### API Rate Limiting
- **General API Routes**: 100 requests per 15 minutes (production), 1000 (development)
- **Authentication Routes**: 5 requests per 15 minutes (production), 50 (development)
- **DoS Protection**: 20 requests per minute (production), 200 (development)

```typescript
// Applied to all /api routes
app.use('/api', apiRateLimit);

// Stricter limits for authentication
app.use('/api/auth', authRateLimit);

// Critical endpoints get additional protection
app.get('/api/dashboard/stats', isAuthenticated, dosProtection, handler);
```

#### Rate Limiting Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

### 2. Security Headers (Helmet.js)

#### Content Security Policy (CSP)
```
default-src 'self'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
script-src 'self' [+'unsafe-eval' in development]
img-src 'self' data: https:
connect-src 'self' ws://localhost:* https://replit.com
```

#### Additional Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Restricts browser features

#### HSTS (HTTP Strict Transport Security)
- `max-age: 31536000` (1 year)
- `includeSubDomains: true`
- `preload: true`

### 3. CORS Protection

#### Production Configuration
- Restricts origins to `*.replit.app` and `*.replit.co`
- Credentials enabled for authentication
- Controlled methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- CSRF token support via `X-CSRF-Token` header

#### Development Configuration
- Allows all origins for easier testing
- Same security measures for headers and methods

### 4. Input Validation Security

#### Zod Validation
- All query parameters validated with type transformation
- Route parameters validated before processing
- Request body validation with detailed error messages
- Range validation for numeric inputs

#### Parameter Validation
```typescript
// Example: Dashboard query validation
const dashboardQuerySchema = z.object({
  days: z.string()
    .regex(/^\d+$/, "Days must be a positive number")
    .transform(Number)
    .refine(val => val >= 1 && val <= 365, "Days must be between 1 and 365")
    .optional()
    .default(30)
});
```

### 5. Entity Existence Validation

#### Pre-operation Checks
- All update operations check entity existence first
- All delete operations verify target exists
- Returns proper 404 responses for non-existent entities
- Prevents database integrity issues

### 6. Authentication Security

#### Session Security
- HTTP-only cookies prevent XSS access
- Secure flag for HTTPS-only transmission
- Session storage in PostgreSQL (not memory)
- Token refresh mechanism for expired sessions

#### Route Protection
- All API routes require authentication
- User session validation on every request
- Proper 401 responses for unauthenticated access

### 7. Request Size Limiting

#### Body Size Limits
```typescript
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
```

- Prevents large payload DoS attacks
- Strict JSON parsing for security
- URL-encoded data size limits

### 8. Error Handling Security

#### Information Disclosure Prevention
- Generic error messages in production
- Detailed logging without exposing internal structure
- Consistent error response format
- No stack traces in API responses

## Environment-Specific Security

### Development Environment
- Relaxed rate limits for testing
- Vite HMR WebSocket connections allowed
- `unsafe-eval` CSP for development tools
- All origins allowed in CORS

### Production Environment
- Strict rate limiting
- Hardened CSP without development allowances
- Origin restrictions in CORS
- HSTS enforcement
- Secure cookie flags

## Security Monitoring

### Rate Limit Monitoring
- Standard headers provide rate limit status
- Logging of rate limit violations
- IP-based tracking and blocking

### Request Logging
- API request/response logging
- User action tracking
- Error monitoring and alerting

## Security Best Practices

### 1. Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Regular security audits

### 2. Environment Variables
- Secure storage of sensitive configuration
- Rotation of secrets and tokens
- Environment-specific settings

### 3. Database Security
- Parameterized queries (via Drizzle ORM)
- Connection pooling with limits
- Encrypted connections in production

### 4. API Security
- Consistent authentication checks
- Input validation on all endpoints
- Proper HTTP status codes
- Rate limiting on sensitive operations

## Incident Response

### Rate Limit Violations
1. Automatic blocking via express-rate-limit
2. Logging of violation attempts
3. Monitoring dashboards for patterns

### Security Header Violations
1. CSP violation reports (if configured)
2. Browser security warning handling
3. Header manipulation detection

### Authentication Issues
1. Failed login attempt logging
2. Session hijacking detection
3. Anomalous access pattern alerts

## Compliance Considerations

### Data Protection
- User data handling in compliance with privacy laws
- Secure data transmission (HTTPS)
- Data retention policies

### Industry Standards
- OWASP Top 10 protection
- REST API security guidelines
- Node.js security best practices

## Testing Security

### Automated Testing
```bash
# Rate limiting test
for i in {1..10}; do curl -s "http://localhost:5000/api/machines" -w "%{http_code}\n"; done

# Security headers test
curl -I "http://localhost:5000" | grep -E "(X-|Content-Security)"

# CORS test
curl -H "Origin: http://malicious-site.com" "http://localhost:5000/api/machines"
```

### Manual Testing
- CSP violation testing
- XSS attempt prevention
- Clickjacking protection verification
- Rate limit boundary testing

This comprehensive security implementation provides enterprise-level protection for the maintenance management system while maintaining usability and performance.