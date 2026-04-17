import { mysqlTable, serial, varchar, text, timestamp, decimal, int, mysqlEnum, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['super_admin', 'admin_villa', 'investor']).notNull().default('admin_villa'),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

export const projects = mysqlTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  status: mysqlEnum('status', ['ready', 'coming_soon']).notNull().default('ready'),
  photoUrl: varchar('photo_url', { length: 500 }),
  facilities: text('facilities'),
  basePrice: decimal('base_price', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
});

export const userProjects = mysqlTable('user_projects', {
  userId: int('user_id').notNull(),
  projectId: int('project_id').notNull(),
}, (t) => ({
  pk: [t.userId, t.projectId],
}));

export const userUnits = mysqlTable('user_units', {
  userId: int('user_id').notNull(),
  unitId: int('unit_id').notNull(),
}, (t) => ({
  pk: [t.userId, t.unitId],
}));

export const units = mysqlTable('units', {
  id: serial('id').primaryKey(),
  projectId: int('project_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['luxury', 'middle', 'low']).notNull(),
  pricePerNight: decimal('price_per_night', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['ready', 'occupied', 'maintenance']).notNull().default('ready'),
  isDeleted: boolean('is_deleted').default(false),
});

export const bookings = mysqlTable('bookings', {
  id: serial('id').primaryKey(),
  unitId: int('unit_id').notNull(),
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  contact: varchar('contact', { length: 50 }).notNull(),
  checkIn: timestamp('check_in').notNull(),
  checkOut: timestamp('check_out').notNull(),
  method: mysqlEnum('method', ['booking.com', 'agoda', 'traveloka', 'tiket.com', 'direct payment', 'whatsapp', 'sosial media', 'others']).notNull(),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['checked_in', 'checked_out', 'upcoming']).notNull().default('upcoming'),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const finances = mysqlTable('finances', {
  id: serial('id').primaryKey(),
  projectId: int('project_id').notNull(),
  unitId: int('unit_id'), // Nullable for project-wide expenses
  name: varchar('name', { length: 255 }),
  type: mysqlEnum('type', ['income', 'expense']).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
});

export const reviews = mysqlTable('reviews', {
  id: serial('id').primaryKey(),
  bookingId: int('booking_id').notNull(),
  rating: int('rating').notNull(),
  comment: text('comment'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userProjects: many(userProjects),
  userUnits: many(userUnits),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  units: many(units),
  finances: many(finances),
  userProjects: many(userProjects),
}));

export const userProjectsRelations = relations(userProjects, ({ one }) => ({
  user: one(users, { fields: [userProjects.userId], references: [users.id] }),
  project: one(projects, { fields: [userProjects.projectId], references: [projects.id] }),
}));

export const userUnitsRelations = relations(userUnits, ({ one }) => ({
  user: one(users, { fields: [userUnits.userId], references: [users.id] }),
  unit: one(units, { fields: [userUnits.unitId], references: [units.id] }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  project: one(projects, { fields: [units.projectId], references: [projects.id] }),
  bookings: many(bookings),
  userUnits: many(userUnits),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  unit: one(units, { fields: [bookings.unitId], references: [units.id] }),
  review: one(reviews, { fields: [bookings.id], references: [reviews.bookingId] }),
}));

export const financesRelations = relations(finances, ({ one }) => ({
  project: one(projects, { fields: [finances.projectId], references: [projects.id] }),
  unit: one(units, { fields: [finances.unitId], references: [units.id] }),
}));
