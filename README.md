# Thai Maintenance Management System

A comprehensive machine maintenance management system designed for Thai enterprises, focusing on streamlining maintenance workflows, tracking equipment history, and optimizing maintenance team coordination.

## ✨ Features

### Core Functionality
- **Machine Management**: Complete equipment inventory with detailed specifications
- **Maintenance Scheduling**: Automated scheduling with interval-based maintenance plans
- **Work Order Management**: Status-based workflow tracking (pending → in_progress → completed/cancelled)
- **Maintenance History**: Comprehensive maintenance records with full audit trail
- **Dashboard Analytics**: Real-time statistics and KPIs
- **Calendar Integration**: Visual maintenance scheduling and timeline view

### Technical Features
- **Enhanced API Response Structure**: Comprehensive metadata and audit trail
- **Status Management Workflow**: Complete lifecycle tracking with timestamps
- **Change Detection Optimization**: Prevents unnecessary database operations
- **Input Validation**: Zod-based validation with comprehensive error handling
- **Database Error Handling**: User-friendly Thai error messages
- **Security**: Production-ready with CSP, rate limiting, and input sanitization

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **shadcn/ui** components built on Radix UI
- **Tailwind CSS** with Thai font support
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with Neon serverless driver
- **Replit Auth** using OpenID Connect
- **Helmet** for security headers
- **Rate limiting** and DoS protection

### Database
- **PostgreSQL** with comprehensive schema
- **Drizzle migrations** for schema management
- **Connection pooling** with @neondatabase/serverless
- **Audit trail** with timestamps and user tracking

## 🏗️ Architecture

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Route components
├── server/                # Express backend
│   ├── utils/            # Server utilities
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── replitAuth.ts     # Authentication setup
├── shared/               # Shared types and schemas
│   ├── schema.ts         # Drizzle database schema
│   └── types.ts          # TypeScript interfaces
└── docs/                 # Documentation
```

### Core Entities
- **Users**: Authentication and role management
- **Machines**: Equipment inventory with specifications
- **Maintenance Schedules**: Planned maintenance with intervals
- **Maintenance Records**: Historical maintenance activities
- **Machine History**: Audit trail for machine changes

## 📋 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout user
- `GET /api/callback` - OAuth callback

### Machines
- `GET /api/machines` - List all machines
- `GET /api/machines/:id` - Get machine details
- `POST /api/machines` - Create new machine
- `PUT /api/machines/:id` - Update machine
- `DELETE /api/machines/:id` - Delete machine

### Maintenance Schedules
- `GET /api/schedules` - List all schedules
- `GET /api/schedules/:id` - Get schedule details
- `POST /api/schedules` - Create new schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Maintenance Records
- `GET /api/records` - List all records
- `GET /api/records/:id` - Get record details
- `POST /api/records` - Create new record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

### Status Management
- `POST /api/records/:id/start` - Start maintenance work
- `POST /api/records/:id/complete` - Complete maintenance work
- `POST /api/records/:id/cancel` - Cancel maintenance work
- `PATCH /api/records/:id/status` - Update status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/calendar/:year/:month` - Get calendar data
- `GET /api/dashboard/upcoming-maintenance` - Get upcoming maintenance

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Replit account (for authentication)

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/maintenance-management-system.git
cd maintenance-management-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and auth configuration

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/maintenance_db
SESSION_SECRET=your-session-secret
REPL_ID=your-replit-app-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.replit.app
NODE_ENV=development
```

## 🔐 Security Features

### Production Security
- **Content Security Policy** (CSP) with strict directives
- **Rate limiting** for API endpoints and authentication
- **Input validation** with Zod schemas
- **SQL injection protection** with Drizzle ORM
- **XSS protection** with sanitized inputs
- **CSRF protection** with secure cookies
- **Helmet** security headers

### Authentication
- **Replit Auth** with OpenID Connect
- **Session management** with PostgreSQL storage
- **JWT token refresh** for long-lived sessions
- **Role-based access control** (manager, technician, admin)

## 📊 Enhanced API Response Structure

All API responses include comprehensive metadata:

```typescript
interface ApiResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  updatedBy?: string;
  updatedAt: Date;
  previousStatus?: string;
  currentStatus?: string;
  action: string;
  workflowStep?: string;
  completedAt?: Date;
}
```

### Example Response
```json
{
  "status": "success",
  "message": "Maintenance work started successfully",
  "updatedRecord": { ... },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "previousStatus": "pending",
  "currentStatus": "in_progress",
  "action": "start_work",
  "workflowStep": "work_started"
}
```

## 🎯 Status Management Workflow

### Status States
1. **Pending** (รอดำเนินการ) - Initial state
2. **In Progress** (กำลังดำเนินการ) - Work started
3. **Completed** (เสร็จสิ้น) - Work finished
4. **Cancelled** (ยกเลิก) - Work cancelled

### Workflow Transitions
```
pending → in_progress → completed
   ↓           ↓
cancelled   cancelled
```

## 📚 Documentation

### Available Documentation
- [User Manual](docs/user-manual.md) - Complete user guide
- [Workflow Guide](docs/workflow-guide.md) - Role-based workflows
- [Technical Documentation](docs/technical-documentation.md) - Architecture details
- [API Documentation](docs/api-documentation.md) - Complete API reference
- [Status Management](docs/maintenance-record-status-management.md) - Status workflow
- [Enhanced API Response](docs/enhanced-api-response-structure.md) - Response structure

### Key Features Documentation
- [Database Error Handling](docs/database-error-handling.md)
- [Create/Update Interface Separation](docs/create-update-interface-separation.md)
- [Change Detection Optimization](docs/change-detection-optimization.md)
- [Input Validation Security](docs/input-validation-security.md)
- [Production Security](docs/production-security-implementation.md)

## 🌐 Deployment

### Replit Deployment
1. Fork or import the project to Replit
2. Set up environment variables in Replit Secrets
3. Configure PostgreSQL database (Neon recommended)
4. Set up Replit Auth domain
5. Deploy using Replit's deployment system

### Manual Deployment
```bash
# Build the project
npm run build

# Start production server
npm start
```

## 🔄 Database Schema

### Core Tables
- `users` - User authentication and profiles
- `machines` - Equipment inventory
- `maintenance_schedules` - Planned maintenance
- `maintenance_records` - Maintenance history
- `machine_history` - Audit trail
- `sessions` - Session storage

### Relationships
- Machines have many maintenance schedules
- Schedules have many maintenance records
- Users perform many maintenance records
- Machines have detailed history tracking

## 🎨 UI/UX Features

### Thai Language Support
- Complete Thai language interface
- Thai date formatting
- Thai number formatting
- Cultural-appropriate UI patterns

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- PWA capabilities

### User Experience
- Toast notifications for actions
- Loading states and skeletons
- Error boundaries
- Optimistic updates

## 🧪 Testing

### API Testing
```bash
# Test endpoints
curl -X GET "http://localhost:5000/api/health"
curl -X GET "http://localhost:5000/api/dashboard/stats"
```

### Database Testing
```bash
# Test database connection
npm run db:studio
```

## 📝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use Drizzle ORM for database operations
3. Implement comprehensive error handling
4. Add proper validation for all inputs
5. Include tests for new features
6. Update documentation

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error boundaries
- Use semantic HTML elements
- Follow accessibility guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the user manual for common workflows

## 🔮 Future Enhancements

### Planned Features
- Mobile app for technicians
- IoT sensor integration
- Predictive maintenance AI
- Advanced reporting and analytics
- Multi-language support
- Integration with external systems

### Technical Improvements
- GraphQL API option
- Real-time notifications
- Advanced caching strategies
- Performance monitoring
- Automated testing suite
- CI/CD pipeline

---

**Built with ❤️ for Thai enterprises**

*A comprehensive maintenance management solution designed to streamline industrial equipment maintenance workflows while supporting Thai language and cultural requirements.*