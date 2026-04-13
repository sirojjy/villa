import { Elysia, t } from 'elysia';
import { db } from '../db';
import { finances, projects } from '../db/schema';
import { eq, desc, and, between, sql } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';

export const financeRoutes = new Elysia({ prefix: '/finances' })
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
      project_id, 
      type, 
      date_from, 
      date_to, 
      page = '1', 
      limit = '50' 
    } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Initial filters
    const filters = [];
    if (project_id) filters.push(eq(finances.projectId, parseInt(project_id)));
    if (type) filters.push(eq(finances.type, type as any));
    
    if (date_from && date_to) {
      filters.push(between(finances.date, new Date(date_from), new Date(date_to)));
    }

    const data = await db.query.finances.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      with: {
        project: true
      },
      limit: parseInt(limit),
      offset: offset,
      orderBy: [desc(finances.date)],
    });

    const summary = await db.select({
      total_income: sql<number>`sum(case when type = 'income' then amount else 0 end)`,
      total_expense: sql<number>`sum(case when type = 'expense' then amount else 0 end)`
    }).from(finances).where(filters.length > 0 ? and(...filters) : undefined);

    return { 
      success: true, 
      data,
      summary: summary[0] || { total_income: 0, total_expense: 0 }
    };
  })
  .post(
    '/',
    async ({ body, user, set }) => {
      // Restriction: Only admin/super admin can record expenses
      if (user.role === 'investor') {
        set.status = 403;
        return { success: false, message: 'Forbidden' };
      }

      const { projectId, type, category, description, amount, date } = body;

      const [newRecord] = await db.insert(finances).values({
        projectId,
        type: type as any,
        category,
        description,
        amount: amount.toString() as any,
        date: date ? new Date(date) : new Date(),
      });

      return { 
        success: true, 
        data: { id: newRecord.insertId },
        message: 'Financial record created successfully'
      };
    },
    {
      body: t.Object({
        projectId: t.Number(),
        type: t.Enum({ income: 'income', expense: 'expense' }),
        category: t.String(),
        description: t.Optional(t.String()),
        amount: t.Number(),
        date: t.Optional(t.String()),
      }),
    }
  );
