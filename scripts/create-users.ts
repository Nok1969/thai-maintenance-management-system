import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { users } from '../shared/schema';

async function createUsers() {
  try {
    console.log('Creating users with hashed passwords...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const managerPassword = await bcrypt.hash('manager123', 12);
    const techPassword = await bcrypt.hash('tech123', 12);

    // Clear existing users
    await db.delete(users);

    // Create new users
    const newUsers = await db.insert(users).values([
      {
        username: 'admin',
        password: adminPassword,
        firstName: 'ผู้ดูแล',
        lastName: 'ระบบ',
        email: 'admin@hotel.com',
        role: 'admin'
      },
      {
        username: 'manager',
        password: managerPassword,
        firstName: 'ผู้จัดการ',
        lastName: 'ฝ่ายบำรุงรักษา',
        email: 'manager@hotel.com',
        role: 'manager'
      },
      {
        username: 'technician',
        password: techPassword,
        firstName: 'ช่างเทคนิค',
        lastName: 'ฝ่ายบำรุงรักษา',
        email: 'tech@hotel.com',
        role: 'technician'
      }
    ]).returning();

    console.log('✅ Users created successfully:');
    newUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role}): ${user.firstName} ${user.lastName}`);
    });

    console.log('\n📋 Login credentials:');
    console.log('Admin: admin / admin123');
    console.log('Manager: manager / manager123');
    console.log('Technician: technician / tech123');

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    process.exit(0);
  }
}

createUsers();