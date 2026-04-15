import { Elysia, t } from 'elysia';
import { db } from '../db';
import { bookings, units, finances } from '../db/schema';
import { eq, desc, and, or, like, sql, inArray } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { getRBACContext, type UserPayload } from '../middleware/rbac';

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
  .get('/', async ({ query, user }) => {
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

    const rbac = await getRBACContext(user as UserPayload);

    // Determine allowed unit IDs
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

    // If restricted but has no units, return empty
    if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch bookings
    const allData = await db.query.bookings.findMany({
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
      ...(allowedUnitIds !== null ? { where: inArray(bookings.unitId, allowedUnitIds) } : {}),
    });
    
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
  .get('/active', async ({ query, user, set }) => {
    const { unit_id } = query;
    if (!unit_id) {
      set.status = 400;
      return { success: false, message: 'unit_id is required' };
    }

    // RBAC check: verify user has access to this unit
    const rbac = await getRBACContext(user as UserPayload);
    const unitData = await db.query.units.findFirst({
      where: eq(units.id, parseInt(unit_id)),
    });

    if (unitData) {
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(unitData.projectId)) {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
      }
      if (rbac.allowedUnitIds !== null && !rbac.allowedUnitIds.includes(unitData.id)) {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
      }
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
    async ({ body, user, set }) => {
      const { 
        unitId, 
        guestName, 
        contact, 
        checkIn, 
        checkOut, 
        method, 
        total,
        attachment 
      } = body;

      // Investors cannot checkin
      if ((user as UserPayload).role === 'investor') {
        set.status = 403;
        return { success: false, message: 'Forbidden: Investors cannot perform check-in' };
      }

      // 1. Check if unit is ready
      const unit = await db.query.units.findFirst({
        where: eq(units.id, parseInt(unitId as any)),
      });

      if (!unit || unit.status !== 'ready') {
        set.status = 400;
        return { success: false, message: 'Unit is not available for check-in' };
      }

      // RBAC check for admin_villa
      const rbac = await getRBACContext(user as UserPayload);
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(unit.projectId)) {
        set.status = 403;
        return { success: false, message: 'Forbidden: Unit is not in your assigned project' };
      }

      let attachmentUrl = null;
      if (attachment) {
        const fileName = `${Date.now()}-${attachment.name}`;
        const path = `uploads/bookings/${fileName}`;
        // Ensure directory exists
        const dir = 'uploads/bookings';
        const fs = require('fs');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        await Bun.write(path, attachment);
        attachmentUrl = `/uploads/bookings/${fileName}`;
      }

      // 2. Wrap in a transaction
      return await db.transaction(async (tx) => {
        // Create booking
        const [newBooking] = await tx.insert(bookings).values({
          unitId: parseInt(unitId as any),
          guestName,
          contact,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          method: method as any,
          total: total.toString() as any,
          status: 'checked_in',
          attachmentUrl,
        });

        // Update unit status
        await tx.update(units)
          .set({ status: 'occupied' })
          .where(eq(units.id, parseInt(unitId as any)));

        // Create financial record (Income)
        await tx.insert(finances).values({
          projectId: unit.projectId,
          type: 'income',
          category: 'Booking',
          description: `Booking Check-in: ${guestName} (Unit ${unit.name})`,
          amount: total.toString() as any,
          date: new Date(),
          attachmentUrl,
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
        unitId: t.Any(), // multipart might send as string
        guestName: t.String(),
        contact: t.String(),
        checkIn: t.String(),
        checkOut: t.String(),
        method: t.String(),
        total: t.Any(),
        attachment: t.Optional(t.File()),
      }),
    }
  )
  .put(
    '/:id/checkout',
    async ({ params: { id }, user, set }) => {
      // Investors cannot checkout
      if ((user as UserPayload).role === 'investor') {
        set.status = 403;
        return { success: false, message: 'Forbidden: Investors cannot perform check-out' };
      }

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

      // RBAC check for admin_villa
      const rbac = await getRBACContext(user as UserPayload);
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(booking.unit.projectId)) {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
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
  )
  .put('/:id', async ({ params: { id }, body, user, set }) => {
    // Investors cannot edit bookings
    if ((user as UserPayload).role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    const bookingId = parseInt(id);
    const { guestName, contact, checkIn, checkOut, method, total, attachment } = body;

    const existing = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: { unit: true }
    });

    if (!existing) {
        set.status = 404;
        return { success: false, message: 'Booking not found' };
    }

    // RBAC check for admin_villa
    const rbac = await getRBACContext(user as UserPayload);
    if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(existing.unit.projectId)) {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    let attachmentUrl = existing.attachmentUrl;
    if (attachment) {
        const fileName = `${Date.now()}-${attachment.name}`;
        const path = `uploads/bookings/${fileName}`;
        const dir = 'uploads/bookings';
        const fs = require('fs');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        await Bun.write(path, attachment);
        attachmentUrl = `/uploads/bookings/${fileName}`;
    }

    await db.update(bookings)
        .set({
            guestName: guestName || undefined,
            contact: contact || undefined,
            checkIn: checkIn ? new Date(checkIn) : undefined,
            checkOut: checkOut ? new Date(checkOut) : undefined,
            method: method as any,
            total: total?.toString() as any,
            attachmentUrl
        })
        .where(eq(bookings.id, bookingId));

    return { success: true, message: 'Booking updated successfully' };
  }, {
    body: t.Object({
      guestName: t.Optional(t.String()),
      contact: t.Optional(t.String()),
      checkIn: t.Optional(t.String()),
      checkOut: t.Optional(t.String()),
      method: t.Optional(t.String()),
      total: t.Optional(t.Any()),
      attachment: t.Optional(t.File()),
    })
  })
  .delete('/:id', async ({ params: { id }, user, set }) => {
    // Investors cannot delete bookings
    if ((user as UserPayload).role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.id, parseInt(id)),
      with: { unit: true }
    });

    if (existing) {
      const rbac = await getRBACContext(user as UserPayload);
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(existing.unit.projectId)) {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
      }
    }

    await db.delete(bookings).where(eq(bookings.id, parseInt(id)));
    return { success: true, message: 'Booking deleted successfully' };
  });
