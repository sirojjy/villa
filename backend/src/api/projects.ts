import { Elysia, t } from 'elysia';
import { db } from '../db';
import { projects, units } from '../db/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { getRBACContext, type UserPayload } from '../middleware/rbac';

export const projectRoutes = new Elysia({ prefix: '/projects' })
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
  .get('/', async ({ user }) => {
    const rbac = await getRBACContext(user as UserPayload);

    // Get all projects with unit counts (Ready/Occupied/Maintenance)
    let data;
    if (rbac.allowedProjectIds !== null) {
      if (rbac.allowedProjectIds.length === 0) {
        return { success: true, data: [] };
      }
      data = await db.query.projects.findMany({
        where: and(
          eq(projects.isDeleted, false),
          inArray(projects.id, rbac.allowedProjectIds)
        ),
        with: {
          units: {
            where: eq(units.isDeleted, false)
          }
        }
      });
    } else if (rbac.allowedUnitIds !== null) {
      // Investor: get projects that contain their units
      if (rbac.allowedUnitIds.length === 0) {
        return { success: true, data: [] };
      }
      const investorUnits = await db.query.units.findMany({
        where: and(
          inArray(units.id, rbac.allowedUnitIds),
          eq(units.isDeleted, false)
        ),
      });
      const investorProjectIds = [...new Set(investorUnits.map(u => u.projectId))];
      if (investorProjectIds.length === 0) {
        return { success: true, data: [] };
      }
      data = await db.query.projects.findMany({
        where: and(
          eq(projects.isDeleted, false),
          inArray(projects.id, investorProjectIds)
        ),
        with: {
          units: {
            where: eq(units.isDeleted, false)
          }
        }
      });
      // Further filter units within each project to only show investor's units
      data = data.map(p => ({
        ...p,
        units: p.units.filter(u => rbac.allowedUnitIds!.includes(u.id))
      }));
    } else {
      data = await db.query.projects.findMany({
        where: eq(projects.isDeleted, false),
        with: {
          units: {
            where: eq(units.isDeleted, false)
          }
        }
      });
    }

    const result = data.map(p => {
      const counts = {
        ready: p.units.filter(u => u.status === 'ready').length,
        occupied: p.units.filter(u => u.status === 'occupied').length,
        maintenance: p.units.filter(u => u.status === 'maintenance').length,
      };
      return { ...p, counts };
    });

    return { success: true, data: result };
  })
  .post('/', async ({ body, user, set }) => {
    if ((user as UserPayload).role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    const [newProject] = await db.insert(projects).values({
      name: body.name,
      address: body.address,
      status: body.status as any,
      photoUrl: body.photoUrl,
      facilities: body.facilities,
      basePrice: body.basePrice?.toString() as any,
    });

    return { success: true, data: { id: newProject.insertId, ...body } };
  }, {
    body: t.Object({
      name: t.String(),
      address: t.Optional(t.String()),
      status: t.Optional(t.String()),
      photoUrl: t.Optional(t.String()),
      facilities: t.Optional(t.String()),
      basePrice: t.Optional(t.Number()),
    })
  })
  .put('/:id', async ({ params: { id }, body, user, set }) => {
    if ((user as UserPayload).role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    await db.update(projects)
      .set({
        name: body.name,
        address: body.address,
        status: body.status as any,
        photoUrl: body.photoUrl,
        facilities: body.facilities,
        basePrice: body.basePrice?.toString() as any,
      })
      .where(eq(projects.id, parseInt(id)));

    return { success: true, message: 'Project updated' };
  }, {
    body: t.Object({
      name: t.String(),
      address: t.Optional(t.String()),
      status: t.Optional(t.String()),
      photoUrl: t.Optional(t.String()),
      facilities: t.Optional(t.String()),
      basePrice: t.Optional(t.Number()),
    })
  })
  .delete('/:id', async ({ params: { id }, user, set }) => {
    if ((user as UserPayload).role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    await db.update(projects)
      .set({ isDeleted: true })
      .where(eq(projects.id, parseInt(id)));
    
    // Also soft delete units
    await db.update(units)
      .set({ isDeleted: true })
      .where(eq(units.projectId, parseInt(id)));
    
    return { success: true, message: 'Project soft-deleted' };
  })
  .get('/:id/units', async ({ params: { id }, user, set }) => {
    const rbac = await getRBACContext(user as UserPayload);

    // RBAC: verify project access
    if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(parseInt(id))) {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    let data = await db.query.units.findMany({
      where: and(
        eq(units.projectId, parseInt(id)),
        eq(units.isDeleted, false)
      ),
    });

    // If investor, filter to only their units
    if (rbac.allowedUnitIds !== null) {
      data = data.filter(u => rbac.allowedUnitIds!.includes(u.id));
    }

    return { success: true, data };
  })
  .post('/:id/units', async ({ params: { id }, body, user, set }) => {
    const role = (user as UserPayload).role;

    // Only super_admin and admin_villa can add units
    if (role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    // admin_villa: verify project belongs to them
    if (role === 'admin_villa') {
      const rbac = await getRBACContext(user as UserPayload);
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(parseInt(id))) {
        set.status = 403;
        return { success: false, message: 'Forbidden: Project is not in your assigned area' };
      }
    }

    const [newUnit] = await db.insert(units).values({
      projectId: parseInt(id),
      name: body.name,
      type: body.type as any,
      pricePerNight: body.pricePerNight.toString() as any,
      status: (body.status || 'ready') as any,
    });

    return { success: true, data: { id: newUnit.insertId, ...body } };
  }, {
    body: t.Object({
      name: t.String(),
      type: t.String(),
      pricePerNight: t.Number(),
      status: t.Optional(t.String()),
    })
  })
  .put('/:id/bulk-price', async ({ params: { id }, body, user, set }) => {
    const role = (user as UserPayload).role;
    if (role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    if (role === 'admin_villa') {
      const rbac = await getRBACContext(user as UserPayload);
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(parseInt(id))) {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
      }
    }

    const { type, price } = body;
    await db.update(units)
      .set({ pricePerNight: price.toString() as any })
      .where(sql`${units.projectId} = ${parseInt(id)} AND ${units.type} = ${type}`);

    return { success: true, message: `Bulk price updated for ${type} in project ${id}` };
  }, {
    body: t.Object({
      type: t.String(),
      price: t.Number()
    })
  });
