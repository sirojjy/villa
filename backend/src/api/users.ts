import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users, userProjects, userUnits } from '../db/schema';
import { eq, or, like } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'sv-villa-secret-key-2026',
    })
  )
  .derive(async ({ jwt, cookie: { auth_token }, set }) => {
    if (!auth_token.value) {
      set.status = 401;
      return { user: null };
    }
    const payload = await jwt.verify(auth_token.value);
    if (!payload) {
      set.status = 401;
      return { user: null };
    }
    return { user: payload };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user || user.role !== 'super_admin') {
      set.status = 403;
      return { success: false, message: 'Forbidden: Super Admin only' };
    }
  })
  .get('/', async ({ query }) => {
    const { search, role, page = '1', limit = '10' } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Basic search filtering
    let whereClause = undefined;
    if (search) {
      whereClause = or(
        like(users.name, `%${search}%`),
        like(users.username, `%${search}%`)
      );
    }

    const data = await db.query.users.findMany({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      orderBy: (users, { desc }) => [desc(users.id)],
      with: {
        userProjects: true,
        userUnits: true,
      }
    });

    return { success: true, data };
  })
  .post('/', async ({ body, set }) => {
    const { name, username, password, role, projectIds, unitIds } = body;

    // Check if username exists
    const existing = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existing) {
      set.status = 400;
      return { success: false, message: 'Username already taken' };
    }

    const passwordHash = await Bun.password.hash(password);

    const [newUser] = await db.insert(users).values({
      name,
      username,
      passwordHash,
      role: role as any,
    });

    // If projects are assigned (for admin_villa)
    if (projectIds && projectIds.length > 0 && role === 'admin_villa') {
      const mappings = projectIds.map(pid => ({
        userId: newUser.insertId,
        projectId: pid
      }));
      await db.insert(userProjects).values(mappings);
    }

    // If units are assigned (for investor)
    if (unitIds && unitIds.length > 0 && role === 'investor') {
      const mappings = unitIds.map(uid => ({
        userId: newUser.insertId,
        unitId: uid
      }));
      await db.insert(userUnits).values(mappings);
    }

    return { success: true, data: { id: newUser.insertId, name, username, role } };
  }, {
    body: t.Object({
      name: t.String(),
      username: t.String(),
      password: t.String(),
      role: t.String(),
      projectIds: t.Optional(t.Array(t.Number())),
      unitIds: t.Optional(t.Array(t.Number()))
    })
  })
  .put('/:id', async ({ params: { id }, body, set }) => {
    const { name, role, projectIds, unitIds } = body;

    await db.update(users)
      .set({ name, role: role as any })
      .where(eq(users.id, parseInt(id)));

    // Update project associations for admin_villa
    if (role === 'admin_villa' && projectIds) {
      // Clear existing
      await db.delete(userProjects).where(eq(userProjects.userId, parseInt(id)));
      
      if (projectIds.length > 0) {
        const mappings = projectIds.map(pid => ({
          userId: parseInt(id),
          projectId: pid
        }));
        await db.insert(userProjects).values(mappings);
      }
    }

    // Update unit associations for investor
    if (role === 'investor' && unitIds) {
      // Clear existing
      await db.delete(userUnits).where(eq(userUnits.userId, parseInt(id)));

      if (unitIds.length > 0) {
        const mappings = unitIds.map(uid => ({
          userId: parseInt(id),
          unitId: uid
        }));
        await db.insert(userUnits).values(mappings);
      }
    }

    // Clean up cross-role associations
    if (role === 'super_admin') {
      await db.delete(userProjects).where(eq(userProjects.userId, parseInt(id)));
      await db.delete(userUnits).where(eq(userUnits.userId, parseInt(id)));
    } else if (role === 'admin_villa') {
      await db.delete(userUnits).where(eq(userUnits.userId, parseInt(id)));
    } else if (role === 'investor') {
      await db.delete(userProjects).where(eq(userProjects.userId, parseInt(id)));
    }

    return { success: true, message: 'User updated successfully' };
  }, {
    body: t.Object({
      name: t.String(),
      role: t.String(),
      projectIds: t.Optional(t.Array(t.Number())),
      unitIds: t.Optional(t.Array(t.Number()))
    })
  })
  .delete('/:id', async ({ params: { id } }) => {
    await db.delete(users).where(eq(users.id, parseInt(id)));
    await db.delete(userProjects).where(eq(userProjects.userId, parseInt(id)));
    await db.delete(userUnits).where(eq(userUnits.userId, parseInt(id)));
    return { success: true, message: 'User deleted successfully' };
  })
  .put('/:id/reset-password', async ({ params: { id }, body }) => {
    const { password } = body;
    const passwordHash = await Bun.password.hash(password);

    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, parseInt(id)));

    return { success: true, message: 'Password reset successfully' };
  }, {
    body: t.Object({
      password: t.String()
    })
  });
