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

      const { projectId, type, category, description, amount, date, attachment } = body;

      let attachmentUrl = null;
      if (attachment) {
        const subFolder = type === 'income' ? 'income' : 'expense';
        const fileName = `${Date.now()}-${attachment.name}`;
        const dir = `uploads/finances/${subFolder}`;
        const path = `${dir}/${fileName}`;
        
        const fs = require('fs');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        await Bun.write(path, attachment);
        attachmentUrl = `/uploads/finances/${subFolder}/${fileName}`;
      }

      const [newRecord] = await db.insert(finances).values({
        projectId: parseInt(projectId as any),
        type: type as any,
        category,
        description: description || null,
        amount: amount.toString() as any,
        date: date ? new Date(date) : new Date(),
        attachmentUrl,
      });

      return { 
        success: true, 
        data: { id: newRecord.insertId },
        message: 'Financial record created successfully'
      };
    },
    {
      body: t.Object({
        projectId: t.Any(),
        type: t.String(),
        category: t.String(),
        description: t.Optional(t.String()),
        amount: t.Any(),
        date: t.Optional(t.String()),
        attachment: t.Optional(t.File()),
      }),
    }
  );
