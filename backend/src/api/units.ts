import { Elysia, t } from 'elysia';
import { db } from '../db';
import { units, projects, bookings } from '../db/schema';
import { eq, desc, and, or, like, sql, inArray } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { getRBACContext, type UserPayload } from '../middleware/rbac';

export const unitRoutes = new Elysia({ prefix: '/units' })
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
    const { search, project_id, status } = query;
    const rbac = await getRBACContext(user as UserPayload);
    
    // Base query fetching all units along with project info
    const data = await db.query.units.findMany({
      where: eq(units.isDeleted, false),
      with: {
        project: true
      }
    });

    let filtered = data;

    // RBAC filtering
    if (rbac.allowedProjectIds !== null) {
      // admin_villa: only units from their projects
      filtered = filtered.filter(u => rbac.allowedProjectIds!.includes(u.projectId));
    } else if (rbac.allowedUnitIds !== null) {
      // investor: only their assigned units
      filtered = filtered.filter(u => rbac.allowedUnitIds!.includes(u.id));
    }

    if (search) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.project?.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (project_id) {
      filtered = filtered.filter(u => u.projectId === parseInt(project_id));
    }

    if (status) {
      filtered = filtered.filter(u => u.status === status);
    }

    return { success: true, data: filtered };
  })
  .get('/:id', async ({ params: { id }, user, set }) => {
    const rbac = await getRBACContext(user as UserPayload);

    const unit = await db.query.units.findFirst({
      where: and(
        eq(units.id, parseInt(id)),
        eq(units.isDeleted, false)
      ),
      with: {
        project: true,
      }
    });

    if (!unit) {
      return { success: false, message: 'Unit not found' };
    }

    // RBAC check
    if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(unit.projectId)) {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }
    if (rbac.allowedUnitIds !== null && !rbac.allowedUnitIds.includes(unit.id)) {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    // Include active booking if occupied
    let activeBooking = null;
    if (unit.status === 'occupied') {
      activeBooking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.unitId, unit.id),
          eq(bookings.status, 'checked_in')
        ),
        orderBy: [desc(bookings.createdAt)]
      });
    }

    return { 
      success: true, 
      data: { ...unit, activeBooking } 
    };
  })
  .put('/:id', async ({ params: { id }, body, user, set }) => {
    const role = (user as UserPayload).role;

    // Investor cannot edit units
    if (role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    // admin_villa: verify unit belongs to their project
    if (role === 'admin_villa') {
      const rbac = await getRBACContext(user as UserPayload);
      const unit = await db.query.units.findFirst({ where: eq(units.id, parseInt(id)) });
      if (!unit || (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(unit.projectId))) {
        set.status = 403;
        return { success: false, message: 'Forbidden: Unit is not in your assigned project' };
      }
    }

    await db.update(units)
      .set({
        name: body.name,
        type: body.type as any,
        pricePerNight: body.pricePerNight?.toString() as any,
        status: body.status as any,
      })
      .where(eq(units.id, parseInt(id)));

    return { success: true, message: 'Unit updated successfully' };
  }, {
    body: t.Object({
      name: t.String(),
      type: t.String(),
      pricePerNight: t.Number(),
      status: t.String(),
    })
  })
  .delete('/:id', async ({ params: { id }, user, set }) => {
    const role = (user as UserPayload).role;

    // Only super_admin and admin_villa (for their projects) can delete
    if (role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    if (role === 'admin_villa') {
      const rbac = await getRBACContext(user as UserPayload);
      const unit = await db.query.units.findFirst({ where: eq(units.id, parseInt(id)) });
      if (!unit || (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(unit.projectId))) {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
      }
    }

    // Check if occupied
    const unit = await db.query.units.findFirst({
      where: eq(units.id, parseInt(id))
    });

    if (unit?.status === 'occupied') {
      set.status = 400;
      return { success: false, message: 'Cannot delete an occupied unit' };
    }

    await db.update(units)
      .set({ isDeleted: true })
      .where(eq(units.id, parseInt(id)));

    return { success: true, message: 'Unit soft-deleted' };
  });
