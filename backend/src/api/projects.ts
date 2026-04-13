import { Elysia, t } from 'elysia';
import { db } from '../db';
import { projects, units } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';

export const projectRoutes = new Elysia({ prefix: '/projects' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'sv-villa-secret-key-2026',
    })
  )
  .use(cookie())
  .derive(async ({ jwt, cookie: { auth_token } }) => {
    const payload = await jwt.verify(auth_token);
    return { user: payload };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }
  })
  .get('/', async () => {
    // Get all projects with unit counts (Ready/Occupied/Maintenance)
    const data = await db.query.projects.findMany({
      with: {
        units: true
      }
    });

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
    if (user.role !== 'super_admin') {
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
    if (user.role !== 'super_admin') {
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
    if (user.role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    await db.delete(projects).where(eq(projects.id, parseInt(id)));
    // Also delete units? PRD doesn't specify cascade, but usually yes.
    await db.delete(units).where(eq(units.projectId, parseInt(id)));
    
    return { success: true, message: 'Project deleted' };
  })
  .get('/:id/units', async ({ params: { id } }) => {
    const data = await db.query.units.findMany({
      where: eq(units.projectId, parseInt(id)),
    });
    return { success: true, data };
  })
  .post('/:id/units', async ({ params: { id }, body, user, set }) => {
    if (user.role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
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
    if (user.role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
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
