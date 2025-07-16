# เอกสารเทคนิค - ระบบบำรุงรักษาเครื่องจักรประจำปี

## ภาพรวมสถาปัตยกรรม (Architecture Overview)

### Frontend Architecture
- **Framework**: React 18 พร้อม TypeScript
- **Build Tool**: Vite สำหรับการพัฒนาและ Build ที่รวดเร็ว
- **UI Framework**: shadcn/ui บน Radix UI
- **Styling**: Tailwind CSS พร้อมการรองรับภาษาไทย
- **State Management**: TanStack Query สำหรับจัดการ Server State
- **Routing**: Wouter สำหรับการจัดการเส้นทาง
- **Forms**: React Hook Form พร้อม Zod Validation

### Backend Architecture
- **Runtime**: Node.js พร้อม Express.js
- **Language**: TypeScript พร้อม ES Modules
- **Database**: PostgreSQL พร้อม Neon Serverless
- **ORM**: Drizzle ORM สำหรับการจัดการฐานข้อมูลแบบ Type-safe
- **Authentication**: Replit Auth ผ่าน OpenID Connect
- **Session**: PostgreSQL Session Store

### Database Schema

#### Tables Structure

```sql
-- Users table (สำหรับ Authentication)
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (สำหรับ Session Management)
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Machines table (เครื่องจักร)
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    manufacturer VARCHAR,
    model VARCHAR,
    serial_number VARCHAR,
    installation_date VARCHAR,
    location VARCHAR NOT NULL,
    department VARCHAR,
    status VARCHAR DEFAULT 'operational',
    manual_url VARCHAR,
    image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Schedules table (แผนการบำรุงรักษา)
CREATE TABLE maintenance_schedules (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    task_name VARCHAR NOT NULL,
    description TEXT,
    maintenance_type VARCHAR NOT NULL,
    frequency VARCHAR NOT NULL,
    start_date VARCHAR NOT NULL,
    next_due_date VARCHAR NOT NULL,
    priority VARCHAR DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Records table (บันทึกการบำรุงรักษา)
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
    technician_id VARCHAR REFERENCES users(id),
    work_date VARCHAR NOT NULL,
    start_time VARCHAR,
    end_time VARCHAR,
    description TEXT NOT NULL,
    parts_used TEXT,
    tools_used TEXT,
    cost DECIMAL(10,2),
    status VARCHAR DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Machine History table (ประวัติการเปลี่ยนแปลง)
CREATE TABLE machine_history (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
    change_type VARCHAR NOT NULL,
    change_description TEXT NOT NULL,
    old_values JSONB,
    changed_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Authentication Routes
```
GET  /api/login          - เริ่มกระบวนการ Login
GET  /api/callback       - Callback สำหรับ OAuth
GET  /api/logout         - ออกจากระบบ
GET  /api/auth/user      - ข้อมูลผู้ใช้ปัจจุบัน
```

#### Machine Management Routes
```
GET    /api/machines        - ดึงรายการเครื่องจักรทั้งหมด
POST   /api/machines        - เพิ่มเครื่องจักรใหม่
GET    /api/machines/:id    - ดึงข้อมูลเครื่องจักรเฉพาะ
PUT    /api/machines/:id    - อัปเดตข้อมูลเครื่องจักร
DELETE /api/machines/:id    - ลบเครื่องจักร
GET    /api/machines/:id/history - ประวัติการเปลี่ยนแปลง
```

#### Maintenance Schedule Routes
```
GET    /api/schedules       - ดึงรายการแผนการบำรุงรักษา
POST   /api/schedules       - สร้างแผนใหม่
GET    /api/schedules/:id   - ดึงข้อมูลแผนเฉพาะ
PUT    /api/schedules/:id   - อัปเดตแผน
DELETE /api/schedules/:id   - ลบแผน
GET    /api/schedules/upcoming - แผนที่จะมาถึง
GET    /api/schedules/overdue   - แผนที่เลยกำหนด
```

#### Maintenance Record Routes
```
GET    /api/records         - ดึงรายการบันทึกการบำรุงรักษา
POST   /api/records         - สร้างบันทึกใหม่
GET    /api/records/:id     - ดึงข้อมูลบันทึกเฉพาะ
PUT    /api/records/:id     - อัปเดตบันทึก
DELETE /api/records/:id     - ลบบันทึก
GET    /api/records/machine/:id - บันทึกของเครื่องจักรเฉพาะ
GET    /api/records/technician/:id - บันทึกของช่างเฉพาะ
```

#### Dashboard Routes
```
GET /api/dashboard/stats    - สถิติสำหรับแดชบอร์ด
GET /api/dashboard/calendar/:year/:month - ข้อมูลปฏิทิน
```

### File Structure

```
project-root/
├── client/                 # Frontend Application
│   ├── src/
│   │   ├── components/     # React Components
│   │   │   ├── ui/        # shadcn/ui Components
│   │   │   ├── forms/     # Form Components
│   │   │   └── ...        # Other Components
│   │   ├── pages/         # Page Components
│   │   ├── hooks/         # Custom React Hooks
│   │   ├── lib/           # Utility Libraries
│   │   ├── App.tsx        # Main App Component
│   │   └── main.tsx       # Entry Point
│   └── index.html         # HTML Template
├── server/                # Backend Application
│   ├── db.ts             # Database Connection
│   ├── storage.ts        # Data Access Layer
│   ├── routes.ts         # API Routes
│   ├── replitAuth.ts     # Authentication Setup
│   ├── vite.ts           # Vite Integration
│   └── index.ts          # Server Entry Point
├── shared/               # Shared Types and Schemas
│   └── schema.ts         # Database Schema and Types
├── docs/                 # Documentation
│   ├── user-manual.md    # User Manual
│   ├── workflow-guide.md # Workflow Guide
│   └── technical-documentation.md # This File
└── ...                   # Config Files
```

### Environment Variables

#### Required Variables
```bash
# Database
DATABASE_URL=postgresql://...
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# Authentication
REPL_ID=replit-app-id
REPLIT_DOMAINS=your-replit-domain.com
SESSION_SECRET=your-session-secret
ISSUER_URL=https://replit.com/oidc
```

### Data Flow Architecture

#### Frontend Data Flow
```
User Action → React Component → TanStack Query → API Request → Backend
                    ↓
              State Update ← Query Cache ← API Response ← Database
```

#### Backend Data Flow
```
API Request → Express Route → Authentication Check → Storage Layer → Database
                                      ↓
              JSON Response ← Business Logic ← Data Processing ← Query Result
```

### Security Considerations

#### Authentication & Authorization
- **OAuth 2.0 + OpenID Connect** ผ่าน Replit
- **Session-based Authentication** พร้อม PostgreSQL Storage
- **HTTP-only Cookies** เพื่อความปลอดภัย
- **CSRF Protection** ผ่าน SameSite Cookies

#### Data Security
- **SQL Injection Protection** ผ่าน Drizzle ORM
- **Input Validation** ด้วย Zod Schema
- **Environment Variables** สำหรับข้อมูลที่ละเอียดอ่อน
- **HTTPS Enforcement** ในการใช้งานจริง

### Performance Optimizations

#### Frontend Optimizations
- **Code Splitting** ด้วย Vite
- **Query Caching** ด้วย TanStack Query
- **Lazy Loading** สำหรับ Components
- **Bundle Optimization** ด้วย Vite Build

#### Backend Optimizations
- **Connection Pooling** สำหรับ Database
- **Query Optimization** ด้วย Drizzle Relations
- **Session Caching** ด้วย PostgreSQL Store
- **Gzip Compression** สำหรับ API Responses

### Error Handling

#### Frontend Error Handling
```typescript
// Query Error Handling
const { data, error, isLoading } = useQuery({
  queryKey: ['/api/machines'],
  retry: (failureCount, error) => {
    if (isUnauthorizedError(error)) {
      window.location.href = '/api/login';
      return false;
    }
    return failureCount < 3;
  }
});

// Mutation Error Handling
const mutation = useMutation({
  mutationFn: apiRequest,
  onError: (error) => {
    if (isUnauthorizedError(error)) {
      toast({ title: "ไม่ได้รับอนุญาต", variant: "destructive" });
      setTimeout(() => window.location.href = '/api/login', 500);
    } else {
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    }
  }
});
```

#### Backend Error Handling
```typescript
// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Route Error Handling
app.get('/api/machines', isAuthenticated, async (req, res) => {
  try {
    const machines = await storage.getMachines();
    res.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ message: 'Failed to fetch machines' });
  }
});
```

### Deployment Configuration

#### Build Process
```bash
# Install Dependencies
npm install

# Build Frontend
npm run build

# Database Migration
npm run db:push

# Start Production Server
npm start
```

#### Docker Configuration (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Monitoring and Logging

#### Application Logs
```typescript
// Custom Logger
export function log(message: string, source = "express") {
  const timestamp = new Date().toLocaleString('th-TH');
  console.log(`${timestamp} [${source}] ${message}`);
}

// Usage
log("User logged in", "auth");
log("Machine created", "machines");
```

#### Error Tracking
- **Console Logging** สำหรับ Development
- **Structured Logging** สำหรับ Production
- **Error Aggregation** ด้วย External Services (เมื่อจำเป็น)

### Database Maintenance

#### Backup Strategy
```sql
-- Daily Backup
pg_dump -h localhost -U username -d database_name > backup_$(date +%Y%m%d).sql

-- Restore from Backup
psql -h localhost -U username -d database_name < backup_20231216.sql
```

#### Index Optimization
```sql
-- Performance Indexes
CREATE INDEX idx_machines_location ON machines(location);
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_schedules_next_due ON maintenance_schedules(next_due_date);
CREATE INDEX idx_records_work_date ON maintenance_records(work_date);
CREATE INDEX idx_history_machine_id ON machine_history(machine_id);
```

### Development Setup

#### Local Development
```bash
# Clone Repository
git clone <repository-url>

# Install Dependencies
npm install

# Setup Environment Variables
cp .env.example .env

# Start Database (PostgreSQL)
# Configure DATABASE_URL in .env

# Run Database Migrations
npm run db:push

# Start Development Server
npm run dev
```

#### Development Tools
- **TypeScript**: Static Type Checking
- **ESLint**: Code Quality
- **Prettier**: Code Formatting
- **Drizzle Studio**: Database Management GUI

### API Testing

#### Sample API Calls
```bash
# Get All Machines
curl -H "Cookie: session_id=..." http://localhost:5000/api/machines

# Create New Machine
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=..." \
  -d '{"machineId":"M001","name":"เครื่องตัดเลเซอร์","type":"laser","location":"โรงงาน A"}' \
  http://localhost:5000/api/machines

# Get Dashboard Stats
curl -H "Cookie: session_id=..." http://localhost:5000/api/dashboard/stats
```

### Version Control

#### Git Workflow
```bash
# Feature Development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Code Review & Merge
# Create Pull Request
# Review & Approve
# Merge to main branch
```

#### Release Management
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Release Notes**: Document changes for each release
- **Changelog**: Maintain CHANGELOG.md

### Future Enhancements

#### Planned Features
1. **Mobile Application**: React Native App
2. **Real-time Notifications**: WebSocket Implementation
3. **Advanced Analytics**: Machine Learning Insights
4. **IoT Integration**: Sensor Data Collection
5. **Multi-language Support**: Additional Languages

#### Technical Debt
1. **Test Coverage**: Add Unit and Integration Tests
2. **Performance Monitoring**: APM Integration
3. **Security Audit**: Regular Security Reviews
4. **Documentation**: API Documentation with OpenAPI

### Troubleshooting Common Issues

#### Database Connection Issues
```typescript
// Connection Pool Configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Memory Leaks
```typescript
// Proper Event Listener Cleanup
useEffect(() => {
  const handler = (event) => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

#### Session Issues
```typescript
// Session Configuration
const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  tableName: 'sessions',
  createTableIfMissing: false,
});
```