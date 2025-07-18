# Replit Configuration

## Overview

This is a comprehensive machine maintenance management system designed for Thai enterprises, focusing on streamlining maintenance workflows, tracking equipment history, and optimizing maintenance team coordination. The application provides a complete solution for managing machines, scheduling maintenance tasks, recording maintenance activities, and generating reports with enhanced API response structure and comprehensive audit trails. It's built with modern tech stack using React, Express, and PostgreSQL with full Thai language support and is now ready for GitHub deployment with complete documentation.

## Recent Changes (July 18, 2025)

✓ **API Schema Validation & Runtime Error Prevention**:
- Added comprehensive Zod validation schemas for all API responses (machineArraySchema, maintenanceScheduleArraySchema, maintenanceScheduleWithMachineArraySchema, maintenanceRecordWithDetailsArraySchema, dashboardStatsSchema)
- Fixed critical runtime errors across all pages: machines?.filter, schedules?.filter, records?.filter, upcomingMaintenance?.slice with Array.isArray() checks
- Implemented comprehensive default fallbacks for API responses to prevent silent bugs
- Enhanced empty state handling with user-friendly messages and action buttons
- Improved error detection with schema parsing that throws immediately on invalid data
- Added proper validation for nested objects with machine relations

✓ **Build Configuration & Deployment Readiness**:
- Fixed build script to output dist/server.js with explicit --outfile parameter
- Corrected start script to reference correct build output file (dist/server.js)
- Verified production build process creates proper server bundle
- Tested health endpoint functionality in production mode
- Ready for deployment with correct file paths and environment configuration

✓ **Select Component Runtime Error Fix**:
- Fixed critical SelectItem runtime error: replaced value="" with value="none" to prevent Radix UI errors
- Updated form handling logic to properly manage undefined/null values for optional selections
- Eliminated "SelectItem must have a value prop that is not an empty string" console errors
- Improved form UX with proper placeholder handling and value state management

✓ **Enhanced API Response Structure Implementation**:
- Enriched API responses with comprehensive metadata (status, message, timestamps)
- Added audit trail fields: updatedBy, updatedAt, previousStatus, currentStatus
- Included workflow tracking: action, workflowStep, completedAt
- Enhanced error responses with detailed error information and context
- Updated frontend to utilize rich response data for better user feedback and logging

✓ **GitHub Repository Preparation**:
- Created comprehensive README.md with complete project documentation
- Added CONTRIBUTING.md with development guidelines and contribution process
- Implemented MIT LICENSE for open source compliance
- Set up GitHub Actions CI/CD pipeline for automated testing and deployment
- Created detailed .gitignore for proper version control
- Prepared complete documentation suite for GitHub deployment

✓ **Content Security Policy Enhancement**:
- Fixed CSP configuration for development mode compatibility
- Added 'unsafe-inline' directive for Vite development server
- Enhanced WebSocket connection support for development HMR
- Maintained strict security settings for production environment

✓ **Production Security Implementation**:
- Enhanced session security with httpOnly, secure, and sameSite cookies
- Added comprehensive security headers (CSP, XSS, CSRF protection)
- Implemented rate limiting and DoS protection measures
- Created environment configuration guide and example files
- Input sanitization and error handling for production safety

✓ **Complete System Integration**:
- Maintenance Record Status Management with comprehensive workflow
- TypeScript Type Safety Enhancement with strict typing
- Database Error Handling with user-friendly Thai error messages
- Change Detection Optimization for performance
- Input Validation Security with Zod-based validation
- Health Check Endpoint for monitoring and deployment

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