# วิธีการเชื่อมต่อกับ GitHub

## 🔗 ขั้นตอนการ Push ไป GitHub

### 1. สร้าง GitHub Repository
1. ไปที่ [GitHub.com](https://github.com/new)
2. ใส่ชื่อ repository: `thai-maintenance-management-system`
3. เพิ่มคำอธิบาย: `ระบบบำรุงรักษาเครื่องจักรสำหรับองค์กรไทย`
4. เลือก **Public** (หรือ **Private** ตามต้องการ)
5. **ไม่ต้อง** เลือก "Initialize this repository with a README"
6. คลิก **Create repository**

### 2. เชื่อมต่อ Local Repository กับ GitHub

#### ใช้ Replit Shell:
```bash
# ตรวจสอบสถานะ Git
git status

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit การเปลี่ยนแปลง
git commit -m "feat: Complete Thai Maintenance Management System

- Enhanced API response structure with comprehensive metadata
- Comprehensive machine maintenance management system
- Thai language UI with full localization
- PostgreSQL database with Drizzle ORM
- Replit authentication integration
- Production-ready security features
- Complete documentation suite
- GitHub CI/CD pipeline ready"

# เพิ่ม remote repository (แทน YOUR_USERNAME ด้วย GitHub username จริง)
git remote add origin https://github.com/YOUR_USERNAME/thai-maintenance-management-system.git

# Push ไป GitHub
git branch -M main
git push -u origin main
```

### 3. ตั้งค่า GitHub Repository

#### 3.1 เพิ่ม Repository Description
1. ไปที่ repository ใน GitHub
2. คลิก เฟือง (Settings) ข้างชื่อ repository
3. เพิ่ม Description: `ระบบบำรุงรักษาเครื่องจักรที่ครอบคลุมสำหรับองค์กรไทย`
4. เพิ่ม Website: `https://your-project.replit.app`
5. เพิ่ม Topics: `maintenance`, `thai`, `react`, `typescript`, `postgresql`

#### 3.2 ตั้งค่า Branch Protection
1. ไปที่ **Settings** > **Branches**
2. คลิก **Add rule**
3. Branch name pattern: `main`
4. เลือก:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

#### 3.3 เปิดใช้ GitHub Actions
1. ไปที่ **Actions** tab
2. คลิก **I understand my workflows, go ahead and enable them**
3. GitHub Actions จะรัน CI/CD pipeline อัตโนมัติ

### 4. การทำงานกับ GitHub

#### 4.1 การอัปเดตโค้ด
```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull origin main

# เพิ่มการเปลี่ยนแปลงใหม่
git add .
git commit -m "description of changes"
git push origin main
```

#### 4.2 สร้าง Pull Request
```bash
# สร้าง branch ใหม่สำหรับ feature
git checkout -b feature/new-feature

# ทำการเปลี่ยนแปลง
# ...

# Commit และ push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

จากนั้นไปที่ GitHub และสร้าง Pull Request

### 5. การ Deploy จาก GitHub

#### 5.1 Replit Import จาก GitHub
1. ไปที่ [Replit](https://replit.com)
2. คลิก **Import from GitHub**
3. ใส่ URL: `https://github.com/YOUR_USERNAME/thai-maintenance-management-system`
4. คลิก **Import from GitHub**

#### 5.2 Auto-sync กับ GitHub
1. ใน Replit project ไปที่ **Version Control**
2. เชื่อมต่อกับ GitHub repository
3. เปิดใช้ auto-sync

### 6. การตั้งค่า Secrets ใน GitHub

#### สำหรับ CI/CD Pipeline:
1. ไปที่ **Settings** > **Secrets and variables** > **Actions**
2. เพิ่ม secrets:
   ```
   DATABASE_URL: postgresql://your-test-db-url
   SESSION_SECRET: your-test-session-secret
   ```

### 7. การใช้ GitHub Issues และ Projects

#### 7.1 สร้าง Issue Templates
1. ไปที่ **Settings** > **Features** > **Issues**
2. คลิก **Set up templates**
3. เลือก **Bug report** และ **Feature request**

#### 7.2 สร้าง Project Board
1. ไปที่ **Projects** tab
2. คลิก **New project**
3. เลือก **Board** template
4. สร้าง columns: To Do, In Progress, Review, Done

### 8. การตั้งค่า GitHub Pages (Documentation)

```bash
# สร้าง docs directory
mkdir docs
cd docs

# สร้าง index.html สำหรับ documentation
echo "<!DOCTYPE html>
<html>
<head>
    <title>Thai Maintenance Management System</title>
</head>
<body>
    <h1>ระบบบำรุงรักษาเครื่องจักร</h1>
    <p>ดูเอกสารฉบับเต็มที่ <a href='../README.md'>README.md</a></p>
</body>
</html>" > index.html
```

จากนั้นเปิดใช้ GitHub Pages ใน **Settings** > **Pages**

### 9. Troubleshooting

#### ปัญหา Authentication
```bash
# ใช้ Personal Access Token แทน password
# ไปที่ GitHub Settings > Developer settings > Personal access tokens
# สร้าง token ใหม่และใช้แทน password
```

#### ปัญหา Git Push
```bash
# ถ้า push ไม่ได้เพราะ history conflicts
git pull --rebase origin main
git push origin main
```

#### ปัญหา Large Files
```bash
# ใช้ .gitignore เพื่อไม่ให้ track files ที่ไม่จำเป็น
echo "node_modules/
.env
dist/
*.log" >> .gitignore
```

---

## 📝 Next Steps

1. ✅ สร้าง GitHub repository
2. ✅ Push โค้ดไป GitHub  
3. ✅ ตั้งค่า branch protection
4. ✅ เปิดใช้ GitHub Actions
5. ✅ เพิ่ม repository description และ topics
6. ⭕ Deploy บน Replit หรือ platform อื่น
7. ⭕ เพิ่ม collaborators (ถ้าต้องการ)
8. ⭕ สร้าง issue templates และ project board

สำหรับคำถามเพิ่มเติม โปรดดูที่ [CONTRIBUTING.md](CONTRIBUTING.md)