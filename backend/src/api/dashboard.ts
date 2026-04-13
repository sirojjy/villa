import { Elysia } from 'elysia';
import { db } from '../db';
import { finances, bookings, units } from '../db/schema';
import { eq, sql, and, between, desc } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'sv-villa-secret-key-2026',
    })
  )
  .derive(async ({ jwt, cookie: { auth_token } }) => {
    if (!auth_token.value) return { user: null };
    const payload = await jwt.verify(auth_token.value);
    return { user: payload };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
  })
  .get('/summary', async ({ set }) => {
    try {
      const today = new Date();
      const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // 1. Revenue Stats (Current vs Prev Month)
      const currentRevenue = await db.select({ 
        total: sql<string>`COALESCE(sum(${finances.amount}), '0')` 
      }).from(finances).where(and(
        eq(finances.type, 'income'),
        between(finances.date, firstDayMonth, lastDayMonth)
      ));

      const prevRevenue = await db.select({ 
        total: sql<string>`COALESCE(sum(${finances.amount}), '0')` 
      }).from(finances).where(and(
        eq(finances.type, 'income'),
        between(finances.date, firstDayPrevMonth, lastDayPrevMonth)
      ));

      // 2. Booking Stats
      const totalBookings = await db.select({ 
        count: sql<number>`count(*)` 
      }).from(bookings);

      // 3. Occupancy Stats
      const occupancyStats = await db.select({
        status: units.status,
        count: sql<number>`count(*)`
      }).from(units).groupBy(units.status);

      // 4. Daily Revenue (Last 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(today.getDate() - 14);

      const dailyRevenue = await db.select({
        day: sql<string>`DATE_FORMAT(${finances.date}, '%Y-%m-%d')`,
        income: sql<string>`COALESCE(sum(case when ${finances.type} = 'income' then ${finances.amount} else 0 end), '0')`,
        expense: sql<string>`COALESCE(sum(case when ${finances.type} = 'expense' then ${finances.amount} else 0 end), '0')`
      })
      .from(finances)
      .where(between(finances.date, fourteenDaysAgo, today))
      .groupBy(sql`DATE_FORMAT(${finances.date}, '%Y-%m-%d')`)
      .orderBy(sql`DATE_FORMAT(${finances.date}, '%Y-%m-%d')`);

      // 5. Recent Bookings
      const recent = await db.query.bookings.findMany({
        limit: 5,
        orderBy: [desc(bookings.createdAt)],
        with: {
          unit: {
            with: { project: true }
          }
        }
      });

      return {
        success: true,
        data: {
          metrics: {
            currentRevenue: Number(currentRevenue[0]?.total || 0),
            prevRevenue: Number(prevRevenue[0]?.total || 0),
            totalBookings: Number(totalBookings[0]?.count || 0),
            occupancy: occupancyStats.reduce((acc: any, curr) => {
              acc[curr.status] = Number(curr.count);
              return acc;
            }, { ready: 0, occupied: 0, maintenance: 0 })
          },
          charts: {
            daily: dailyRevenue.map(d => ({
              ...d,
              income: Number(d.income),
              expense: Number(d.expense)
            }))
          },
          recentActivity: recent
        }
      };
    } catch (error: any) {
      set.status = 500;
      console.error('Dashboard API Error:', error);
      return { success: false, message: error.message };
    }
  });
