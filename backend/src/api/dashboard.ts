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
  .get('/summary', async ({ user, set, query }) => {
    try {
      const { projectId, month, year } = query as { projectId?: string, month?: string, year?: string };
      const rbac = await getRBACContext(user as UserPayload);

      // --- Dynamic Year Calculation ---
      const minDateResult = await db.select({
        minDate: sql<string>`MIN(${finances.date})`
      }).from(finances);
      
      let minYear = new Date().getFullYear();
      if (minDateResult[0]?.minDate) {
        minYear = new Date(minDateResult[0].minDate).getFullYear();
      }
      
      const currentYear = new Date().getFullYear();
      const availableYears = [];
      for (let y = minYear; y <= currentYear; y++) {
        availableYears.push(y);
      }
      if (!availableYears.includes(currentYear)) availableYears.push(currentYear);

      // --- Date Logic ---
      const today = new Date();
      let targetMonth = today.getMonth();
      let targetYear = today.getFullYear();

      if (month !== undefined && !isNaN(Number(month))) {
        targetMonth = Number(month);
      }
      if (year !== undefined && !isNaN(Number(year))) {
        targetYear = Number(year);
      }

      const firstDayMonth = new Date(targetYear, targetMonth, 1);
      const lastDayMonth = new Date(targetYear, targetMonth + 1, 0);

      const firstDayPrevMonth = new Date(targetYear, targetMonth - 1, 1);
      const lastDayPrevMonth = new Date(targetYear, targetMonth, 0);

      // Chart end date: end of target month, or today if it's the current month
      let chartEndDate = new Date(targetYear, targetMonth + 1, 0);
      if (targetYear === today.getFullYear() && targetMonth === today.getMonth()) {
        chartEndDate = new Date();
      }

      // 30 days prior logic for daily revenue chart
      const chartStartDate = new Date(chartEndDate);
      chartStartDate.setDate(chartEndDate.getDate() - 29); // 30 days including end date

      // Determine allowed project IDs based on RBAC and Query Filter
      let effectiveProjectIds = rbac.allowedProjectIds;
      if (projectId && projectId !== 'all') {
        const pId = Number(projectId);
        if (effectiveProjectIds !== null) {
          if (effectiveProjectIds.includes(pId)) {
            effectiveProjectIds = [pId];
          } else {
            effectiveProjectIds = []; // Forbidden by RBAC
          }
        } else {
          effectiveProjectIds = [pId]; // Super admin filtering by project
        }
      }

      // Determine allowed unit IDs for filtering
      let allowedUnitIds: number[] | null = null;
      if (effectiveProjectIds !== null) {
        // admin_villa or super_admin with specific project filter
        const projectUnits = await db.query.units.findMany({
          where: and(
            inArray(units.projectId, effectiveProjectIds.length > 0 ? effectiveProjectIds : [0]),
            eq(units.isDeleted, false)
          ),
        });
        allowedUnitIds = projectUnits.map(u => u.id);
      } else if (rbac.allowedUnitIds !== null) {
        // investor: directly assigned units
        allowedUnitIds = rbac.allowedUnitIds;
        // If investor filters by project, we only keep units that belong to that project
        if (projectId && projectId !== 'all') {
            const pId = Number(projectId);
            const investorUnitsInProject = await db.query.units.findMany({
                where: and(
                    inArray(units.id, allowedUnitIds.length > 0 ? allowedUnitIds : [0]),
                    eq(units.projectId, pId)
                )
            });
            allowedUnitIds = investorUnitsInProject.map(u => u.id);
        }
      }
      // super_admin without project filter: allowedUnitIds remains null (unrestricted)

      const isInvestor = (user as UserPayload).role === 'investor';

      // --- Revenue Stats (hide from investor) ---
      let currentRevenue = 0;
      let prevRevenue = 0;
      let dailyRevenue: any[] = [];

      if (!isInvestor) {
        // Build finance filters
        const financeProjectFilter = effectiveProjectIds !== null && effectiveProjectIds.length > 0
          ? inArray(finances.projectId, effectiveProjectIds)
          : undefined;

        // If effectiveProjectIds is explicitly empty array (forbidden/no projects), return 0
        if (effectiveProjectIds !== null && effectiveProjectIds.length === 0) {
            currentRevenue = 0;
            prevRevenue = 0;
            dailyRevenue = [];
        } else {
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

            // Daily Revenue (Last 30 days up to chartEndDate)
            const bookingFilter = allowedUnitIds !== null 
              ? inArray(bookings.unitId, allowedUnitIds.length > 0 ? allowedUnitIds : [0])
              : undefined;

            const dailyRevenueResult = await db.select({
              day: sql<string>`DATE_FORMAT(${bookings.checkIn}, '%Y-%m-%d')`,
              income: sql<string>`COALESCE(sum(${bookings.total}), '0')`,
              expense: sql<string>`'0'` // Expense is 0 when querying from bookings
            })
            .from(bookings)
            .where(and(
              between(bookings.checkIn, chartStartDate, chartEndDate),
              bookingFilter
            ))
            .groupBy(sql`DATE_FORMAT(${bookings.checkIn}, '%Y-%m-%d')`)
            .orderBy(sql`DATE_FORMAT(${bookings.checkIn}, '%Y-%m-%d')`);

            dailyRevenue = dailyRevenueResult.map(d => ({
              ...d,
              income: Number(d.income),
              expense: Number(d.expense)
            }));
        }
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
          availableYears,
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
