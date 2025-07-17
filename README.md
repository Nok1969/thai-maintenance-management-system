# Machine Maintenance Management System

A comprehensive industrial machinery tracking and maintenance scheduling application built for Thai enterprises. Features streamlined maintenance workflows, equipment history tracking, and team coordination tools.

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Database**
   ```bash
   npm run db:push
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000` to access the application.

## 📋 Features

### Core Functionality
- **Machine Management**: Complete equipment inventory with specifications
- **Maintenance Scheduling**: Automated scheduling with priority levels
- **History Tracking**: Comprehensive maintenance records and audit trails
- **Dashboard Analytics**: Real-time KPIs and performance metrics
- **Location Management**: Multi-location support with filtering

### User Roles
- **Managers**: Full system access, reporting, and user management
- **Technicians**: Maintenance execution and record keeping
- **Administrators**: System configuration and advanced settings

### Technical Features
- **Authentication**: Secure Replit Auth integration
- **Database**: PostgreSQL with type-safe Drizzle ORM
- **API**: RESTful design with comprehensive error handling
- **Security**: Production-ready with HTTPS, CORS, and input validation
- **Logging**: Structured logging with performance monitoring

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development builds
- **shadcn/ui** components with Radix UI
- **Tailwind CSS** for styling
- **TanStack Query** for state management
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for database operations
- **PostgreSQL** with Neon serverless
- **Passport.js** for authentication
- **Comprehensive middleware** for security

### Development
- **Hot Module Replacement** with Vite
- **Type Safety** throughout the stack
- **ESLint/Prettier** for code quality
- **Environment-based configuration**

## 📖 Documentation

- **[User Manual](docs/user-manual.md)**: Complete usage instructions
- **[Workflow Guide](docs/workflow-guide.md)**: Role-based processes
- **[Technical Documentation](docs/technical-documentation.md)**: Architecture and API
- **[Environment Setup](docs/environment-setup.md)**: Configuration guide

## 🔧 Configuration

### Required Environment Variables
```env
DATABASE_URL=postgresql://user:password@host/database
SESSION_SECRET=your-super-secret-session-key
REPL_ID=your-replit-client-id
REPLIT_DOMAINS=your-app.replit.app
```

See [Environment Setup Guide](docs/environment-setup.md) for complete configuration details.

## 🚀 Deployment

### Replit Deployment
1. Push code to Replit
2. Provision PostgreSQL database
3. Configure environment variables
4. Deploy using Replit Deployments

### Custom Deployment
1. Configure production environment variables
2. Build the application: `npm run build`
3. Set up PostgreSQL database
4. Deploy to your hosting platform

## 🔒 Security Features

- **HTTPS-only cookies** in production
- **XSS protection** with Content Security Policy
- **CSRF protection** with SameSite cookies
- **Input sanitization** for all user data
- **Rate limiting** to prevent abuse
- **Error handling** without information leakage

## 📊 Database Schema

### Core Tables
- **users**: Authentication and user management
- **machines**: Equipment inventory and specifications
- **maintenance_schedules**: Planned maintenance tasks
- **maintenance_records**: Historical maintenance activities
- **machine_history**: Change tracking and audit trails
- **sessions**: Secure session storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review the [troubleshooting guide](docs/environment-setup.md#troubleshooting)
- Open an issue in the repository

## 🔄 Recent Updates

- Enhanced security with production-ready configurations
- Improved authentication with comprehensive error handling
- Added structured logging and performance monitoring
- Implemented rate limiting and DoS protection
- Created comprehensive documentation suite

Built with ❤️ for Thai industrial enterprises