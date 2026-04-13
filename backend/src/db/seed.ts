import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, 'admin'),
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists. Skipping seed.');
    return;
  }

  const passwordHash = await Bun.password.hash('admin123');

  await db.insert(users).values({
    name: 'Super Admin',
    username: 'admin',
    passwordHash: passwordHash,
    role: 'super_admin',
  });

  console.log('✅ Seed completed: admin / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
