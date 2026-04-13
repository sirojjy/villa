import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cookie } from '@elysiajs/cookie';
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
  .use(cookie())
  .post(
    '/login',
    async ({ body, jwt, setCookie, set }) => {
      const { username, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
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

      setCookie('auth_token', token, {
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
  .post('/logout', ({ setCookie }) => {
    setCookie('auth_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });
    return { success: true, message: 'Logged out successfully' };
  })
  .get('/me', async ({ jwt, cookie: { auth_token }, set }) => {
    if (!auth_token) {
      set.status = 401;
      return { success: false, message: 'Unauthorized' };
    }

    const payload = await jwt.verify(auth_token);
    if (!payload) {
      set.status = 401;
      return { success: false, message: 'Invalid token' };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id as number),
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
      },
    };
  });
