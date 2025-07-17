# การ Deploy ระบบบำรุงรักษาเครื่องจักร

## 🚀 การ Deploy บน Replit

### ขั้นตอนที่ 1: Setup Repository
1. Fork หรือ Clone repository นี้ไปยัง Replit
2. เปิดโปรเจ็กต์ใน Replit

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables
ไปที่ **Secrets** tab ใน Replit และเพิ่มตัวแปรเหล่านี้:

```
DATABASE_URL=postgresql://your-db-url
SESSION_SECRET=your-random-secret-key
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=your-domain.replit.app
NODE_ENV=production
```

### ขั้นตอนที่ 3: ตั้งค่า Database
1. ใช้ Neon PostgreSQL (แนะนำ) หรือ database ที่รองรับ
2. รัน `npm run db:push` เพื่อสร้าง schema
3. ทดสอบการเชื่อมต่อฐานข้อมูล

### ขั้นตอนที่ 4: ตั้งค่า Replit Auth
1. ไปที่ Replit Auth settings
2. เพิ่ม domain ของ Replit app
3. คัดลอก REPL_ID มาใส่ใน Secrets

### ขั้นตอนที่ 5: Deploy
1. กด **Deploy** button ใน Replit
2. เลือก **Autoscale Deployment**
3. รอให้ deployment เสร็จ

## 🌐 การ Deploy บน Cloud Platform อื่นๆ

### Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables ใน Vercel dashboard
```

### Railway
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway deploy
```

### DigitalOcean App Platform
1. เชื่อมต่อ GitHub repository
2. เลือก Node.js app
3. เพิ่ม environment variables
4. Deploy

## 🗄️ การตั้งค่า Database

### Neon (แนะนำสำหรับ Replit)
```bash
# 1. สร้าง account ที่ neon.tech
# 2. สร้าง database ใหม่
# 3. คัดลอก connection string
# 4. เพิ่มใน DATABASE_URL
```

### Supabase
```bash
# 1. สร้าง project ใน supabase.com
# 2. ไปที่ Settings > Database
# 3. คัดลอก Connection string
# 4. แก้ไข password ใน string
```

### PlanetScale
```bash
# 1. สร้าง database ใน planetscale.com
# 2. สร้าง branch (main)
# 3. คัดลอก connection string
# 4. เพิ่มใน DATABASE_URL
```

## 🔧 การตั้งค่า Custom Domain

### Replit Custom Domain
1. ไปที่ Replit project settings
2. เพิ่ม Custom Domain
3. อัปเดต REPLIT_DOMAINS ใน secrets

### Cloudflare (สำหรับ custom domain)
1. เพิ่ม CNAME record ที่ชี้ไปยัง Replit domain
2. อัปเดต domain configuration

## 📊 Monitoring และ Logging

### ตั้งค่า Health Check
- Endpoint: `/api/health`
- ตรวจสอบทุกๆ 5 นาที
- Alert เมื่อ response time > 5 วินาที

### Log Monitoring
```bash
# ดู logs ใน Replit Console
# หรือใช้ external logging service เช่น:
# - LogRocket
# - Sentry
# - DataDog
```

## 🔒 Security Checklist

### Production Security
- [ ] ตั้งค่า NODE_ENV=production
- [ ] ใช้ strong SESSION_SECRET
- [ ] ตั้งค่า rate limiting
- [ ] เปิดใช้ HTTPS
- [ ] ตรวจสอบ CSP headers

### Database Security
- [ ] ใช้ connection pooling
- [ ] ตั้งค่า database firewall
- [ ] เปิดใช้ SSL connection
- [ ] ตั้งค่า backup schedule

## 🚨 Troubleshooting

### ปัญหาการเชื่อมต่อ Database
```bash
# ตรวจสอบ connection string
echo $DATABASE_URL

# ทดสอบการเชื่อมต่อ
npm run db:studio
```

### ปัญหา Authentication
```bash
# ตรวจสอบ Replit Auth configuration
# - REPL_ID ถูกต้อง
# - REPLIT_DOMAINS ตรงกับ deployment domain
# - Callback URL ถูกต้อง
```

### ปัญหา Performance
```bash
# ตรวจสอบ memory usage
# เพิ่ม connection pooling
# ใช้ caching สำหรับ queries ที่ใช้บ่อย
```

## 📈 Scaling

### Horizontal Scaling
- ใช้ load balancer
- เพิ่ม multiple instances
- ตั้งค่า session sharing

### Database Scaling
- ใช้ read replicas
- เพิ่ม connection pooling
- ตั้งค่า database indexes

---

สำหรับคำถามเพิ่มเติม โปรดดูที่ [README.md](README.md) หรือสร้าง issue ใน GitHub repository