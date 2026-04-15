import { Elysia } from 'elysia';
import { db } from '../db';
import { finances, bookings, units } from '../db/schema';
import { eq, sql, and, between, desc, inArray } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { getRBACContext, type UserPayload } from '../middleware/rbac';

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
  .get('/summary', async ({ user, set }) => {
    try {
      const rbac = await getRBACContext(user as UserPayload);

      const today = new Date();
      const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Determine allowed unit IDs for filtering
      let allowedUnitIds: number[] | null = null;
      if (rbac.allowedProjectIds !== null) {
        // admin_villa: get units from allowed projects
        const projectUnits = await db.query.units.findMany({
          where: and(
            inArray(units.projectId, rbac.allowedProjectIds.length > 0 ? rbac.allowedProjectIds : [0]),
            eq(units.isDeleted, false)
          ),
        });
        allowedUnitIds = projectUnits.map(u => u.id);
      } else if (rbac.allowedUnitIds !== null) {
        // investor: directly assigned units
        allowedUnitIds = rbac.allowedUnitIds;
      }
      // super_admin: allowedUnitIds remains null (unrestricted)

      const isInvestor = (user as UserPayload).role === 'investor';

      // --- Revenue Stats (hide from investor) ---
      let currentRevenue = 0;
      let prevRevenue = 0;
      let dailyRevenue: any[] = [];

      if (!isInvestor) {
        // Build finance filters
        const financeProjectFilter = rbac.allowedProjectIds !== null && rbac.allowedProjectIds.length > 0
          ? inArray(finances.projectId, rbac.allowedProjectIds)
          : undefined;

        const currentRevenueResult = await db.select({
          total: sql<string>`COALESCE(sum(${finances.amount}), '0')`
        }).from(finances).where(and(
          eq(finances.type, 'income'),
          between(finances.date, firstDayMonth, lastDayMonth),
          financeProjectFilter
        ));

        const prevRevenueResult = await db.select({
          total: sql<string>`COALESCE(sum(${finances.amount}), '0')`
        }).from(finances).where(and(
          eq(finances.type, 'income'),
          between(finances.date, firstDayPrevMonth, lastDayPrevMonth),
          financeProjectFilter
        ));

        currentRevenue = Number(currentRevenueResult[0]?.total || 0);
        prevRevenue = Number(prevRevenueResult[0]?.total || 0);

        // Daily Revenue (Last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(today.getDate() - 14);

        const dailyRevenueResult = await db.select({
          day: sql<string>`DATE_FORMAT(${finances.date}, '%Y-%m-%d')`,
          income: sql<string>`COALESCE(sum(case when ${finances.type} = 'income' then ${finances.amount} else 0 end), '0')`,
          expense: sql<string>`COALESCE(sum(case when ${finances.type} = 'expense' then ${finances.amount} else 0 end), '0')`
        })
        .from(finances)
        .where(and(
          between(finances.date, fourteenDaysAgo, today),
          financeProjectFilter
        ))
        .groupBy(sql`DATE_FORMAT(${finances.date}, '%Y-%m-%d')`)
        .orderBy(sql`DATE_FORMAT(${finances.date}, '%Y-%m-%d')`);

        dailyRevenue = dailyRevenueResult.map(d => ({
          ...d,
          income: Number(d.income),
          expense: Number(d.expense)
        }));
      }

      // --- Booking Stats ---
      let totalBookingsCount = 0;
      if (allowedUnitIds !== null) {
        if (allowedUnitIds.length > 0) {
          const result = await db.select({
            count: sql<number>`count(*)`
          }).from(bookings).where(inArray(bookings.unitId, allowedUnitIds));
          totalBookingsCount = Number(result[0]?.count || 0);
        }
      } else {
        const result = await db.select({
          count: sql<number>`count(*)`
        }).from(bookings);
        totalBookingsCount = Number(result[0]?.count || 0);
      }

      // --- Occupancy Stats ---
      let occupancyFilter = eq(units.isDeleted, false);
      let occupancyStats;
      if (allowedUnitIds !== null && allowedUnitIds.length > 0) {
        occupancyStats = await db.select({
          status: units.status,
          count: sql<number>`count(*)`
        })
        .from(units)
        .where(and(occupancyFilter, inArray(units.id, allowedUnitIds)))
        .groupBy(units.status);
      } else if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
        occupancyStats = [];
      } else {
        occupancyStats = await db.select({
          status: units.status,
          count: sql<number>`count(*)`
        })
        .from(units)
        .where(occupancyFilter)
        .groupBy(units.status);
      }

      // --- Recent Bookings ---
      let recent;
      if (allowedUnitIds !== null && allowedUnitIds.length > 0) {
        recent = await db.query.bookings.findMany({
          limit: 5,
          where: inArray(bookings.unitId, allowedUnitIds),
          orderBy: [desc(bookings.createdAt)],
          with: {
            unit: {
              with: { project: true }
            }
          }
        });
      } else if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
        recent = [];
      } else {
        recent = await db.query.bookings.findMany({
          limit: 5,
          orderBy: [desc(bookings.createdAt)],
          with: {
            unit: {
              with: { project: true }
            }
          }
        });
      }

      return {
        success: true,
        data: {
          metrics: {
            ...(isInvestor ? {} : { currentRevenue, prevRevenue }),
            totalBookings: totalBookingsCount,
            occupancy: (occupancyStats || []).reduce((acc: any, curr) => {
              acc[curr.status] = Number(curr.count);
              return acc;
            }, { ready: 0, occupied: 0, maintenance: 0 })
          },
          ...(isInvestor ? {} : {
            charts: {
              daily: dailyRevenue
            }
          }),
          recentActivity: recent
        }
      };
    } catch (error: any) {
      set.status = 500;
      console.error('Dashboard API Error:', error);
      return { success: false, message: error.message };
    }
  });
