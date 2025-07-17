# Replit Configuration

## Overview

This is a full-stack maintenance management system built for industrial machinery tracking and maintenance scheduling. The application provides a comprehensive solution for managing machines, scheduling maintenance tasks, recording maintenance activities, and generating reports. It's designed with a modern tech stack using React, Express, and PostgreSQL with Thai language support for the user interface.

## Recent Changes (July 17, 2025)

✓ **Logging System Modularized**:
- Created centralized logger utility (`server/utils/logger.ts`)
- Extracted API request/response logging into reusable functions
- Added configurable log levels (Error, Info, Warning, Debug)
- Improved maintainability and scalability of logging system

✓ **CORS Security Implementation**:
- Added CORS middleware with environment-based configuration
- Development: Allow all origins for flexibility
- Production: Restrict to Replit domains for security
- Enabled credentials and configured proper headers

✓ **Server Architecture Improvements**:
- Fixed HTTP server creation consistency  
- Improved error handling with structured logging
- Enhanced middleware organization and order

✓ **Authentication Security Enhancements**:
- Added comprehensive null checks for req.user across all protected routes
- Optimized upsertUser() to run only on fresh login, not token refresh
- Improved Express version compatibility for logout functionality
- Enhanced error handling with environment-specific logging

✓ **Production Security Implementation**:
- Enhanced session security with httpOnly, secure, and sameSite cookies
- Added comprehensive security headers (CSP, XSS, CSRF protection)
- Implemented rate limiting and DoS protection measures
- Created environment configuration guide and example files
- Input sanitization and error handling for production safety

✓ **Input Validation Security Enhancement**:
- Replaced all unsafe parseInt() calls with Number() + isNaN() validation
- Created centralized validation utilities (server/utils/validation.ts)
- Added comprehensive parameter validation for all API routes
- Enhanced frontend form validation with safe numeric parsing
- Added specialized validators for dates, ports, and query parameters

✓ **Zod-Based API Validation Implementation**:
- Created comprehensive query validation schemas (server/utils/queryValidation.ts)
- Implemented middleware for query, parameter, and body validation
- Added pagination, date filtering, and machine filtering schemas
- Enhanced error handling with detailed field-level validation messages
- Applied Zod validation to all API routes with proper type transformation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom color variables and Thai font support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with conventional HTTP methods
- **Session Management**: Express sessions with PostgreSQL storage
- **Middleware**: Custom logging, JSON parsing, and error handling

### Authentication Strategy
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies with secure flags for production

## Key Components

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Connection**: Connection pooling with @neondatabase/serverless

### Core Entities
1. **Users**: Authentication and role management (manager, technician, admin)
2. **Machines**: Equipment inventory with detailed specifications
3. **Maintenance Schedules**: Planned maintenance with intervals and priorities
4. **Maintenance Records**: Historical maintenance activities and outcomes

### Business Logic
- **Dashboard Analytics**: Real-time statistics and KPIs
- **Calendar Integration**: Visual maintenance scheduling
- **Status Tracking**: Machine operational states and maintenance priorities
- **Reporting**: Maintenance history and performance metrics

## Data Flow

### Authentication Flow
1. User accesses protected routes
2. Middleware checks session validity
3. Redirects to Replit Auth if unauthenticated
4. Creates/updates user record on successful authentication
5. Establishes session with PostgreSQL storage

### API Request Flow
1. Client makes authenticated requests with credentials included
2. Express middleware validates session
3. Route handlers interact with storage layer
4. Drizzle ORM executes type-safe database queries
5. JSON responses with error handling

### Client State Management
1. TanStack Query manages server state caching
2. Automatic refetching and background updates
3. Optimistic updates for better UX
4. Error boundaries for graceful failure handling

## External Dependencies

### Database Services
- **Neon**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connections for serverless environments

### Authentication
- **Replit Auth**: OpenID Connect integration
- **Session Storage**: PostgreSQL table for session persistence

### Development Tools
- **Vite**: Development server with HMR
- **TypeScript**: Static type checking
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Build Process
1. Frontend: Vite builds optimized static assets
2. Backend: ESBuild bundles server code for Node.js
3. Database: Drizzle migrations ensure schema consistency

### Environment Configuration
- **Development**: Local development with Vite dev server
- **Production**: Static asset serving with Express
- **Database**: Environment-based connection strings

### File Structure
- `/client`: React frontend application
- `/server`: Express backend API
- `/shared`: Common TypeScript types and schemas
- `/docs`: Complete documentation suite
  - `user-manual.md`: Detailed user instructions
  - `workflow-guide.md`: Role-based workflows and processes
  - `technical-documentation.md`: Technical architecture and API docs
  - `README.md`: Project overview and quick start guide

### Runtime Requirements
- Node.js environment with ES module support
- PostgreSQL database connection
- Environment variables for authentication and database

The application follows a monorepo structure with clear separation between client and server code, shared type definitions, and a robust authentication system integrated with Replit's platform.