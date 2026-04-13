import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users, userProjects } from '../db/schema';
import { eq, or, like } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'sv-villa-secret-key-2026',
    })
  )
  .use(cookie())
  .derive(async ({ jwt, cookie: { auth_token }, set }) => {
    if (!auth_token) {
      set.status = 401;
      return { user: null };
    }
    const payload = await jwt.verify(auth_token);
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
    });

    return { success: true, data };
  })
  .post('/', async ({ body, set }) => {
    const { name, username, password, role, projectIds } = body;

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

    // If projects are assigned
    if (projectIds && projectIds.length > 0 && role !== 'super_admin') {
      const mappings = projectIds.map(pid => ({
        userId: newUser.insertId,
        projectId: pid
      }));
      await db.insert(userProjects).values(mappings);
    }

    return { success: true, data: { id: newUser.insertId, name, username, role } };
  }, {
    body: t.Object({
      name: t.String(),
      username: t.String(),
      password: t.String(),
      role: t.String(),
      projectIds: t.Optional(t.Array(t.Number()))
    })
  })
  .put('/:id', async ({ params: { id }, body, set }) => {
    const { name, role, projectIds } = body;

    await db.update(users)
      .set({ name, role: role as any })
      .where(eq(users.id, parseInt(id)));

    // Update project associations if provided
    if (projectIds && role !== 'super_admin') {
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

    return { success: true, message: 'User updated successfully' };
  }, {
    body: t.Object({
      name: t.String(),
      role: t.String(),
      projectIds: t.Optional(t.Array(t.Number()))
    })
  })
  .delete('/:id', async ({ params: { id } }) => {
    await db.delete(users).where(eq(users.id, parseInt(id)));
    await db.delete(userProjects).where(eq(userProjects.userId, parseInt(id)));
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
