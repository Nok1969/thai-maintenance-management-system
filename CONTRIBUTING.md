# Contributing to Thai Maintenance Management System

We welcome contributions to the Thai Maintenance Management System! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git knowledge
- TypeScript experience
- React experience

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/maintenance-management-system.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see `.env.example`)
5. Set up database: `npm run db:push`
6. Start development server: `npm run dev`

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Follow React best practices and hooks rules

### Database Changes
- Use Drizzle ORM for all database operations
- Never write raw SQL queries
- Use `npm run db:push` for schema changes
- Update schema documentation when adding new tables

### API Development
- Follow RESTful API conventions
- Use Zod for input validation
- Implement proper error handling
- Add comprehensive logging
- Include authentication where needed

### Frontend Development
- Use shadcn/ui components when possible
- Implement proper loading states
- Add error boundaries
- Use TanStack Query for data fetching
- Maintain Thai language support

## 🔧 Technical Requirements

### TypeScript
- Strict mode enabled
- No `any` types (use proper interfaces)
- Use shared types from `shared/types.ts`
- Implement proper error types

### Testing
- Write unit tests for new features
- Test API endpoints with proper authentication
- Test database operations
- Include edge case testing

### Security
- Validate all inputs
- Use parameterized queries
- Implement proper authentication checks
- Follow OWASP security guidelines

## 🎯 Feature Development

### Adding New Features
1. Create a feature branch: `git checkout -b feature/feature-name`
2. Implement the feature following guidelines
3. Add tests for the new functionality
4. Update documentation
5. Submit a pull request

### Database Schema Changes
1. Update `shared/schema.ts` with new tables/columns
2. Update TypeScript interfaces
3. Add validation schemas
4. Update API routes if needed
5. Test database operations

### API Endpoint Changes
1. Update `server/routes.ts`
2. Add proper validation
3. Update storage interface if needed
4. Add error handling
5. Update documentation

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public functions
- Document complex algorithms
- Explain business logic
- Update API documentation

### User Documentation
- Update user manual for new features
- Add workflow examples
- Include screenshots for UI changes
- Update troubleshooting guides

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="test-name"
```

### Test Types
- Unit tests for individual functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for user workflows

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior**
What should have happened

**Actual Behavior**
What actually happened

**Environment**
- OS: [e.g., Windows 10, macOS 12]
- Browser: [e.g., Chrome 91, Firefox 89]
- Node.js version: [e.g., 18.17.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature request

**Problem Statement**
What problem would this solve?

**Proposed Solution**
How would you like this to be implemented?

**Alternatives**
Any alternative solutions you've considered

**Additional Context**
Any other relevant information
```

## 🔄 Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation
3. Follow code style guidelines
4. Add appropriate comments
5. Test thoroughly

### PR Template
```markdown
**Description**
Brief description of changes

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process
1. Create pull request with clear description
2. Assign appropriate reviewers
3. Address feedback promptly
4. Ensure CI checks pass
5. Merge after approval

## 🌐 Internationalization

### Thai Language Support
- All user-facing text should be in Thai
- Use proper Thai date/time formatting
- Follow Thai cultural conventions
- Test with Thai input data

### Adding New Languages
1. Create translation files
2. Update language detection
3. Test with different locales
4. Update documentation

## 🔒 Security

### Security Best Practices
- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication
- Follow OWASP guidelines

### Reporting Security Issues
- Email security issues privately
- Do not create public issues for security bugs
- Allow time for patches before disclosure
- Provide clear reproduction steps

## 📈 Performance

### Performance Guidelines
- Optimize database queries
- Use pagination for large datasets
- Implement caching where appropriate
- Monitor bundle size
- Use React.memo for expensive components

### Monitoring
- Add performance metrics
- Monitor API response times
- Track database query performance
- Use proper logging for debugging

## 🏆 Recognition

### Contributors
All contributors will be recognized in:
- README.md contributor section
- Release notes
- Project documentation

### Code of Conduct
We follow a code of conduct that promotes:
- Respectful communication
- Inclusive environment
- Collaborative problem-solving
- Professional behavior

## 📞 Getting Help

### Support Channels
- GitHub Issues for bugs and features
- GitHub Discussions for questions
- Documentation for common issues
- Code comments for implementation details

### Development Resources
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## 🎉 Thank You

Thank you for contributing to the Thai Maintenance Management System! Your efforts help make industrial maintenance management more efficient and accessible for Thai enterprises.

---

*This project is built with ❤️ for the Thai industrial community*