# ระบบบำรุงรักษาเครื่องจักรประจำปี

## ภาพรวม

ระบบบำรุงรักษาเครื่องจักรประจำปีเป็นเว็บแอปพลิเคชันที่ออกแบบมาเพื่อจัดการการบำรุงรักษาเครื่องจักรในโรงงานอุตสาหกรรมอย่างเป็นระบบ โดยสามารถติดตามการบำรุงรักษาแบบป้องกัน บันทึกประวัติการซ่อมแซม และสร้างรายงานเพื่อการวิเคราะห์ประสิทธิภาพ

## คุณสมบัติหลัก

### 🔧 จัดการเครื่องจักร
- ลงทะเบียนเครื่องจักรพร้อมข้อมูลรายละเอียด
- ติดตามสถานะเครื่องจักรแบบเรียลไทม์
- ระบบติดตามประวัติการเปลี่ยนแปลงอัตโนมัติ
- การจัดกลุ่มตามตำแหน่งและแผนก

### 📅 วางแผนการบำรุงรักษา
- สร้างแผนการบำรุงรักษาแบบป้องกัน
- กำหนดความถี่และระดับความสำคัญ
- ระบบแจ้งเตือนอัตโนมัติ
- ติดตามงานที่เลยกำหนด

### 📝 บันทึกการบำรุงรักษา
- บันทึกรายละเอียดการทำงานครบถ้วน
- ติดตามการใช้อะไหล่และเครื่องมือ
- บันทึกค่าใช้จ่ายและเวลาที่ใช้
- มอบหมายงานให้ช่างเทคนิค

### 📊 รายงานและวิเคราะห์
- แดชบอร์ดแสดงสถิติภาพรวม
- รายงานประสิทธิภาพเครื่องจักร
- วิเคราะห์ต้นทุนการบำรุงรักษา
- ส่งออกรายงานเป็น PDF/Excel

### 🔒 ระบบความปลอดภัย
- การเข้าสู่ระบบผ่าน Replit Auth
- การจัดการสิทธิ์ตามบทบาท
- ระบบเซสชันที่ปลอดภัย
- การสำรองข้อมูลอัตโนมัติ

## เทคโนโลยีที่ใช้

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **TanStack Query** - Data Fetching
- **React Hook Form** - Form Management
- **Zod** - Schema Validation

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **TypeScript** - Language
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Passport.js** - Authentication

### Infrastructure
- **Replit** - Hosting Platform
- **Neon** - Serverless PostgreSQL
- **Vite** - Build Tool

## การติดตั้งและใช้งาน

### ข้อกำหนดระบบ
- Node.js 18 หรือสูงกว่า
- PostgreSQL Database
- Replit Account สำหรับ Authentication

### การติดตั้ง
1. Clone โปรเจกต์
```bash
git clone <repository-url>
cd maintenance-system
```

2. ติดตั้ง Dependencies
```bash
npm install
```

3. ตั้งค่า Environment Variables
```bash
cp .env.example .env
# แก้ไขไฟล์ .env ตามข้อมูลของคุณ
```

4. เตรียมฐานข้อมูล
```bash
npm run db:push
```

5. เริ่มต้นใช้งาน
```bash
npm run dev
```

### การใช้งานครั้งแรก
1. เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost:5000`
2. คลิกปุ่ม "เข้าสู่ระบบ"
3. เข้าสู่ระบบด้วยบัญชี Replit
4. เริ่มใช้งานระบบได้ทันที

## โครงสร้างโปรเจกต์

```
project-root/
├── client/          # Frontend React Application
├── server/          # Backend Express Application  
├── shared/          # Shared Types and Schemas
├── docs/           # Documentation Files
├── package.json    # Project Dependencies
└── README.md       # This File
```

## เอกสารประกอบ

- [คู่มือการใช้งาน](docs/user-manual.md) - วิธีการใช้งานระบบโดยละเอียด
- [คู่มือ Workflow](docs/workflow-guide.md) - ขั้นตอนการทำงานและกระบวนการ
- [เอกสารเทคนิค](docs/technical-documentation.md) - รายละเอียดทางเทคนิค

## การพัฒนาและการมีส่วนร่วม

### การพัฒนาฟีเจอร์ใหม่
1. สร้าง Branch ใหม่จาก main
2. พัฒนาฟีเจอร์และทดสอบ
3. สร้าง Pull Request
4. รอการ Review และ Merge

### การรายงานปัญหา
- สร้าง Issue ใน GitHub Repository
- ระบุรายละเอียดปัญหาและขั้นตอนการทำซ้ำ
- แนบภาพหน้าจอหรือ Error Log

### การขอฟีเจอร์ใหม่
- สร้าง Feature Request ใน GitHub Issues
- อธิบายความต้องการและประโยชน์
- หารือกับทีมพัฒนา

## API Reference

### Machine Management
```
GET    /api/machines        - ดึงรายการเครื่องจักร
POST   /api/machines        - เพิ่มเครื่องจักรใหม่
PUT    /api/machines/:id    - อัปเดตเครื่องจักร
DELETE /api/machines/:id    - ลบเครื่องจักร
```

### Maintenance Planning  
```
GET    /api/schedules       - ดึงรายการแผนการบำรุงรักษา
POST   /api/schedules       - สร้างแผนใหม่
PUT    /api/schedules/:id   - อัปเดตแผน
DELETE /api/schedules/:id   - ลบแผน
```

### Maintenance Records
```
GET    /api/records         - ดึงรายการบันทึก
POST   /api/records         - สร้างบันทึกใหม่
PUT    /api/records/:id     - อัปเดตบันทึก
DELETE /api/records/:id     - ลบบันทึก
```

## การสนับสนุน

### ช่องทางติดต่อ
- **Email**: support@maintenance-system.com
- **GitHub Issues**: สำหรับปัญหาทางเทคนิค
- **Documentation**: ดูเอกสารประกอบใน /docs

### FAQ
**Q: จะเพิ่มผู้ใช้งานใหม่ได้อย่างไร?**
A: ผู้ใช้งานใหม่สามารถเข้าสู่ระบบด้วยบัญชี Replit ได้ทันที ระบบจะสร้างบัญชีผู้ใช้อัตโนมัติ

**Q: จะสำรองข้อมูลได้อย่างไร?**
A: ระบบมีการสำรองข้อมูลอัตโนมัติทุกวัน หรือสามารถติดต่อผู้ดูแลเพื่อขอสำรองเพิ่มเติม

**Q: สามารถใช้งานบนมือถือได้หรือไม่?**
A: ได้ครับ ระบบรองรับการใช้งานบนมือถือผ่านเว็บเบราว์เซอร์

## ใบอนุญาต

โปรเจกต์นี้อยู่ภายใต้ใบอนุญาต MIT License - ดู [LICENSE](LICENSE) สำหรับรายละเอียด

## เวอร์ชัน

**เวอร์ชันปัจจุบัน**: v1.0.0

### ประวัติการอัปเดต
- **v1.0.0** (2024-07-16)
  - เปิดตัวระบบครั้งแรก
  - ฟีเจอร์จัดการเครื่องจักรครบถ้วน
  - ระบบวางแผนและบันทึกการบำรุงรักษา
  - แดชบอร์ดและรายงาน
  - ระบบติดตามประวัติการเปลี่ยนแปลง

## ผู้พัฒนา

พัฒนาโดย AI Assistant บน Replit Platform
สำหรับการใช้งานในโรงงานอุตสาหกรรม

---

*เอกสารนี้อัปเดตล่าสุดเมื่อ: 16 กรกฎาคม 2025*