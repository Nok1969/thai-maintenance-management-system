# Environment Setup Guide

This guide explains how to configure environment variables for the maintenance management system.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values

## Required Environment Variables

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:port/database
```
- **Required**: PostgreSQL connection string
- **Example**: `postgresql://postgres:mypassword@localhost:5432/maintenance_db`
- **Replit**: Automatically provided when you provision a database

### Session Security
```env
SESSION_SECRET=your-super-secret-session-key
```
- **Required**: Random string for session encryption (min 32 characters)
- **Security**: Use a strong, random secret in production
- **Generate**: `openssl rand -base64 32` or use a password generator

### Replit Authentication
```env
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-replit-client-id
REPLIT_DOMAINS=your-app.replit.app
```
- **ISSUER_URL**: OpenID Connect provider URL (default: `https://replit.com/oidc`)
- **REPL_ID**: Your Replit application client ID
- **REPLIT_DOMAINS**: Comma-separated list of allowed domains

## Optional Environment Variables

### Custom Domain Configuration
```env
COOKIE_DOMAIN=.your-domain.com
ALLOWED_ORIGINS=https://your-frontend.com,https://admin.your-domain.com
```
- **COOKIE_DOMAIN**: Set for custom domains (include leading dot for subdomains)
- **ALLOWED_ORIGINS**: Additional CORS origins (comma-separated)

### Application Settings
```env
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
```
- **NODE_ENV**: `development` or `production`
- **PORT**: Server port (default: 5000)
- **LOG_LEVEL**: Logging verbosity

### Security & Performance
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
- **RATE_LIMIT_WINDOW_MS**: Rate limit window in milliseconds (default: 15 minutes)
- **RATE_LIMIT_MAX_REQUESTS**: Max requests per window (default: 100)

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/maintenance_dev
SESSION_SECRET=dev-session-secret-not-for-production
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_pass@prod-host:5432/maintenance_prod
SESSION_SECRET=super-secure-random-session-secret-64-chars-minimum
REPLIT_DOMAINS=my-app.replit.app,maintenance.mycompany.com
COOKIE_DOMAIN=.mycompany.com
ALLOWED_ORIGINS=https://admin.mycompany.com
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, random secrets** in production
3. **Rotate secrets regularly** (especially SESSION_SECRET)
4. **Restrict CORS origins** in production
5. **Use HTTPS-only domains** in production

## Getting Replit Authentication Credentials

1. Go to your Replit project settings
2. Navigate to "Authentication" section
3. Copy the `REPL_ID` value
4. Add your domains to the allowed domains list
5. Copy the domain names to `REPLIT_DOMAINS`

## Troubleshooting

### Authentication Issues
- Check that `REPL_ID` matches your Replit project
- Verify `REPLIT_DOMAINS` includes your actual domain
- Ensure `SESSION_SECRET` is set and consistent

### Database Connection Issues
- Verify `DATABASE_URL` format and credentials
- Check database server is running and accessible
- Ensure database exists and user has proper permissions

### CORS Issues
- Add your frontend domain to `ALLOWED_ORIGINS`
- Check that domains use `https://` in production
- Verify `REPLIT_DOMAINS` includes all necessary domains

## Environment Variables Validation

The application validates required environment variables on startup:

- ✅ **Development**: Provides fallbacks for easier local development
- ✅ **Production**: Requires all security-critical variables
- ✅ **Startup Check**: Fails fast if required variables are missing

## Example Configurations

### Local Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/maintenance_dev
SESSION_SECRET=dev-session-secret
```

### Replit Deployment
```env
NODE_ENV=production
# DATABASE_URL automatically provided by Replit
SESSION_SECRET=your-production-session-secret
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=your-app.replit.app
```

### Custom Domain Deployment
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=your-production-session-secret
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=maintenance.company.com
COOKIE_DOMAIN=.company.com
ALLOWED_ORIGINS=https://admin.company.com,https://mobile.company.com
```