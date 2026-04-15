import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'sv-villa-secret-key-2026',
    })
  )
  .post(
    '/login',
    async ({ body, jwt, cookie: { auth_token }, set }) => {
      const { username, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
        with: {
          userProjects: true,
          userUnits: true,
        }
      });

      if (!user) {
        set.status = 401;
        return { success: false, message: 'Invalid username or password' };
      }

      const isPasswordCorrect = await Bun.password.verify(password, user.passwordHash);
      if (!isPasswordCorrect) {
        set.status = 401;
        return { success: false, message: 'Invalid username or password' };
      }

      const token = await jwt.sign({
        id: user.id,
        role: user.role,
      });

      auth_token.set({
        value: token,
        httpOnly: true,
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      });

      // Update last login
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

      return {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          projectIds: user.userProjects.map(p => p.projectId),
          unitIds: user.userUnits.map(u => u.unitId),
        },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .post('/logout', ({ cookie: { auth_token } }) => {
    auth_token.remove();
    return { success: true, message: 'Logged out successfully' };
  })
  .get('/me', async ({ jwt, cookie: { auth_token }, set }) => {
    if (!auth_token.value) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }

    const payload = await jwt.verify(auth_token.value);
    if (!payload) {
      set.status = 401;
      return { success: false, message: 'Invalid token' };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id as number),
      with: {
        userProjects: true,
        userUnits: true,
      }
    });

    if (!user) {
      set.status = 401;
      return { success: false, message: 'User not found' };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        projectIds: user.userProjects.map(p => p.projectId),
        unitIds: user.userUnits.map(u => u.unitId),
      },
    };
  });
