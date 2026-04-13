import { Elysia, t } from 'elysia';
import { db } from '../db';
import { bookings, units, finances } from '../db/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';

export const bookingRoutes = new Elysia({ prefix: '/bookings' })
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
  .get('/', async ({ query }) => {
    const { 
      search, 
      status, 
      project_id, 
      date_from, 
      date_to, 
      page = '1', 
      limit = '10' 
    } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Initial query
    const baseQuery = db.query.bookings.findMany({
      with: {
        unit: {
          with: {
            project: true
          }
        }
      },
      limit: parseInt(limit),
      offset: offset,
      orderBy: [desc(bookings.createdAt)],
    });

    // In a real scenario with more complex filters, we'd use the drizzle-orm/sql builder more heavily
    // For now, let's fetch and filter if project_id is present, or just return all
    // Better implementation would be joining tables explicitly if filtering by project metadata
    
    // For MVP, we'll fetch then filter for the specific project if needed
    // In production, we should use joined queries with .where()
    const allData = await baseQuery;
    
    let filtered = allData;
    if (project_id) {
      filtered = allData.filter(b => b.unit.projectId === parseInt(project_id));
    }
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    if (search) {
      filtered = filtered.filter(b => 
        b.guestName.toLowerCase().includes(search.toLowerCase()) || 
        b.unit.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return { success: true, data: filtered };
  })
  .get('/active', async ({ query, set }) => {
    const { unit_id } = query;
    if (!unit_id) {
      set.status = 400;
      return { success: false, message: 'unit_id is required' };
    }

    const booking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.unitId, parseInt(unit_id)),
        eq(bookings.status, 'checked_in')
      ),
      orderBy: [desc(bookings.createdAt)]
    });

    return { success: true, data: booking };
  })
  .post(
    '/checkin',
    async ({ body, set }) => {
      const { 
        unitId, 
        guestName, 
        contact, 
        checkIn, 
        checkOut, 
        method, 
        total 
      } = body;

      // 1. Check if unit is ready
      const unit = await db.query.units.findFirst({
        where: eq(units.id, unitId),
      });

      if (!unit || unit.status !== 'ready') {
        set.status = 400;
        return { success: false, message: 'Unit is not available for check-in' };
      }

      // 2. Wrap in a transaction
      return await db.transaction(async (tx) => {
        // Create booking
        const [newBooking] = await tx.insert(bookings).values({
          unitId,
          guestName,
          contact,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          method: method as any,
          total: total.toString() as any,
          status: 'checked_in',
        });

        // Update unit status
        await tx.update(units)
          .set({ status: 'occupied' })
          .where(eq(units.id, unitId));

        // Create financial record (Income)
        await tx.insert(finances).values({
          projectId: unit.projectId,
          type: 'income',
          category: 'Booking',
          description: `Booking Check-in: ${guestName} (Unit ${unit.name})`,
          amount: total.toString() as any,
          date: new Date(),
        });

        return { 
          success: true, 
          data: { id: newBooking.insertId },
          message: 'Guest checked in successfully'
        };
      });
    },
    {
      body: t.Object({
        unitId: t.Number(),
        guestName: t.String(),
        contact: t.String(),
        checkIn: t.String(),
        checkOut: t.String(),
        method: t.String(),
        total: t.Number(),
      }),
    }
  )
  .put(
    '/:id/checkout',
    async ({ params: { id }, set }) => {
      const bookingId = parseInt(id);

      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          unit: true
        }
      });

      if (!booking || booking.status !== 'checked_in') {
        set.status = 400;
        return { success: false, message: 'Booking is not in a check-in state' };
      }

      return await db.transaction(async (tx) => {
        // Update booking status
        await tx.update(bookings)
          .set({ status: 'checked_out' })
          .where(eq(bookings.id, bookingId));

        // Update unit status
        await tx.update(units)
          .set({ status: 'ready' })
          .where(eq(units.id, booking.unitId));

        return { success: true, message: 'Guest checked out successfully' };
      });
    }
  );
