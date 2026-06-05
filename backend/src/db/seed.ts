import { db } from './index';
import { users, projects, units, bookings, finances } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Seed Admin
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, 'admin'),
  });

  if (!existingAdmin) {
    const passwordHash = await Bun.password.hash('admin123');
    await db.insert(users).values({
      name: 'Super Admin',
      username: 'admin',
      passwordHash: passwordHash,
      role: 'super_admin',
    });
    console.log('✅ Admin user seeded.');
  } else {
    console.log('✅ Admin user already exists. Skipping admin seed.');
  }

  // 2. Seed Bookings and Finances for the last 90 days
  const allProjects = await db.select().from(projects);
  const allUnits = await db.select().from(units);

  if (allProjects.length === 0 || allUnits.length === 0) {
    console.log('⚠️ No projects or units found. Please create some projects and units first before running this seeder for bookings.');
    process.exit(0);
  }

  console.log('📅 Generating bookings and finances for the last 90 days...');

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const bookingMethods = ['booking.com', 'agoda', 'traveloka', 'tiket.com', 'direct payment', 'whatsapp'];
  const expenseCategories = ['Maintenance', 'Listrik & Air', 'Kebersihan', 'Lain-lain'];

  const newBookings = [];
  const newFinances = [];

  for (let i = 90; i >= 0; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    
    // Determine target occupancy for this specific day
    // Weekend: 100%, Weekday: random 0 to 60%
    const targetOccupancy = isWeekend ? 1.0 : (Math.random() * 0.6);

    for (const project of allProjects) {
      const projectUnits = allUnits.filter(u => u.projectId === project.id && !u.isDeleted);
      
      // Expenses for the day per project
      // Randomly add 0 to 2 expenses per day
      const numExpenses = Math.floor(Math.random() * 3);
      for (let e = 0; e < numExpenses; e++) {
        const expenseAmount = Math.floor(Math.random() * 500000) + 50000; // 50k to 550k
        newFinances.push({
          projectId: project.id,
          unitId: null, // Project wide expense
          name: `Pengeluaran Operasional Harian`,
          type: 'expense' as const,
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          description: `Seeded expense for ${currentDate.toLocaleDateString()}`,
          amount: expenseAmount.toString(),
          date: currentDate,
        });
      }

      for (const unit of projectUnits) {
        // Does this unit get booked today?
        const isBooked = Math.random() < targetOccupancy;
        
        if (isBooked) {
          const checkOutDate = new Date(currentDate);
          checkOutDate.setDate(currentDate.getDate() + 1); // 1 night stay for simplicity
          
          const method = bookingMethods[Math.floor(Math.random() * bookingMethods.length)] as any;
          const price = Number(unit.pricePerNight);
          const status = i === 0 ? 'checked_in' : 'checked_out'; // Today is checked in, past is checked out
          
          const bookingId = Math.floor(Math.random() * 1000000); // Temporary ID mapping not strictly needed if we just insert, but we don't have returning IDs easily without sequential inserts.
          
          newBookings.push({
            unitId: unit.id,
            guestName: `Guest ${Math.floor(Math.random() * 1000)}`,
            contact: `0812${Math.floor(Math.random() * 100000000)}`,
            checkIn: currentDate,
            checkOut: checkOutDate,
            method: method,
            total: price.toString(),
            status: status as any,
            createdAt: currentDate,
          });

          newFinances.push({
            projectId: project.id,
            unitId: unit.id,
            name: `Income from Booking ${unit.name}`,
            type: 'income' as const,
            category: 'Room Booking',
            description: `Seeded booking income via ${method}`,
            amount: price.toString(),
            date: currentDate,
          });
        }
      }
    }
  }

  // Batch inserts
  console.log(`⏳ Inserting ${newBookings.length} bookings...`);
  if (newBookings.length > 0) {
    // Insert in chunks to avoid mysql limits
    const chunkSize = 100;
    for (let i = 0; i < newBookings.length; i += chunkSize) {
      await db.insert(bookings).values(newBookings.slice(i, i + chunkSize));
    }
  }

  console.log(`⏳ Inserting ${newFinances.length} finance records...`);
  if (newFinances.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < newFinances.length; i += chunkSize) {
      await db.insert(finances).values(newFinances.slice(i, i + chunkSize));
    }
  }

  console.log('✅ 3-Month Database Seeding Completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
