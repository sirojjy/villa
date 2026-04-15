import { Elysia, t } from 'elysia';
import { db } from '../db';
import { finances, projects } from '../db/schema';
import { eq, desc, and, between, sql, like, or, inArray } from 'drizzle-orm';
import { jwt } from '@elysiajs/jwt';
import { getRBACContext, type UserPayload } from '../middleware/rbac';

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
    // Investor cannot access any financial data
    if ((user as any).role === 'investor') {
      set.status = 403;
      return { success: false, message: 'Forbidden: Investors cannot access financial data' };
    }
  })
  .get('/', async ({ query, user }) => {
    const rbac = await getRBACContext(user as UserPayload);

    const {
      project_id,
      type,
      date_from,
      date_to,
      search,
      page = '1', 
      limit = '50'
    } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Initial filters
    const filters = [];
    if (project_id && project_id !== '0') filters.push(eq(finances.projectId, parseInt(project_id)));
    if (type) filters.push(eq(finances.type, type as any));

    if (date_from && date_to) {
      filters.push(between(finances.date, new Date(date_from), new Date(date_to)));
    }

    if (search) {
      filters.push(or(
        like(finances.description, `%${search}%`),
        like(finances.category, `%${search}%`)
      ));
    }

    // RBAC: admin_villa can only see their projects' finances
    if (rbac.allowedProjectIds !== null) {
      if (rbac.allowedProjectIds.length > 0) {
        filters.push(inArray(finances.projectId, rbac.allowedProjectIds));
      } else {
        return { success: true, data: [] };
      }
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

    return { 
      success: true, 
      data
    };
  })
  .get('/summary', async ({ query, user }) => {
    const rbac = await getRBACContext(user as UserPayload);

    const { 
      project_id, 
      type, 
      date_from, 
      date_to,
      search 
    } = query;

    const filters = [];
    if (project_id && project_id !== '0') filters.push(eq(finances.projectId, parseInt(project_id)));
    if (type) filters.push(eq(finances.type, type as any));
    if (date_from && date_to) {
      filters.push(between(finances.date, new Date(date_from), new Date(date_to)));
    }
    if (search) {
      filters.push(or(
        like(finances.description, `%${search}%`),
        like(finances.category, `%${search}%`)
      ));
    }

    // RBAC: admin_villa filter
    if (rbac.allowedProjectIds !== null) {
      if (rbac.allowedProjectIds.length > 0) {
        filters.push(inArray(finances.projectId, rbac.allowedProjectIds));
      } else {
        return { success: true, data: { totalIncome: 0, totalExpense: 0 } };
      }
    }

    const summaryData = await db.select({
      totalIncome: sql<number>`sum(case when type = 'income' then amount else 0 end)`,
      totalExpense: sql<number>`sum(case when type = 'expense' then amount else 0 end)`
    }).from(finances).where(filters.length > 0 ? and(...filters) : undefined);

    return { 
      success: true, 
      data: summaryData[0] || { totalIncome: 0, totalExpense: 0 }
    };
  })
  .post(
    '/',
    async ({ body, user, set }) => {
      const rbac = await getRBACContext(user as UserPayload);
      const { projectId, type, category, description, amount, date, attachment } = body;

      // RBAC: admin_villa can only create for their projects
      if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(parseInt(projectId as any))) {
        set.status = 403;
        return { success: false, message: 'Forbidden: Project is not in your assigned area' };
      }

      let attachmentUrl = null;
      if (attachment) {
        const subFolder = type === 'income' ? 'income' : 'expense';
        const fileName = `${Date.now()}-${attachment.name}`;
        const dir = `uploads/finances/${subFolder}`;
        const path = `${dir}/${fileName}`;

        const fs = require('fs');
        if (!fs.existsSync(dir)) {
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
  )
  .put('/:id', async ({ params: { id }, body, user, set }) => {
    const rbac = await getRBACContext(user as UserPayload);
    const financeId = parseInt(id);
    const { projectId, type, category, description, amount, date, attachment } = body;

    const existing = await db.query.finances.findFirst({
      where: eq(finances.id, financeId)
    });

    if (!existing) {
      set.status = 404;
      return { success: false, message: 'Record not found' };
    }

    // RBAC: admin_villa can only edit their projects' records
    if (rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(existing.projectId)) {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    let attachmentUrl = existing.attachmentUrl;
    if (attachment) {
      const subFolder = type === 'income' ? 'income' : 'expense';
      const fileName = `${Date.now()}-${attachment.name}`;
      const dir = `uploads/finances/${subFolder}`;
      const path = `${dir}/${fileName}`;
      const fs = require('fs');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await Bun.write(path, attachment);
      attachmentUrl = `/uploads/finances/${subFolder}/${fileName}`;
    }

    await db.update(finances)
      .set({
        projectId: projectId ? parseInt(projectId as any) : undefined,
        type: type as any,
        category: category || undefined,
        description: description || undefined,
        amount: amount?.toString() as any,
        date: date ? new Date(date) : undefined,
        attachmentUrl,
      })
      .where(eq(finances.id, financeId));

    return { success: true, message: 'Financial record updated successfully' };
  }, {
    body: t.Object({
      projectId: t.Optional(t.Any()),
      type: t.Optional(t.String()),
      category: t.Optional(t.String()),
      description: t.Optional(t.String()),
      amount: t.Optional(t.Any()),
      date: t.Optional(t.String()),
      attachment: t.Optional(t.File()),
    })
  })
  .delete('/:id', async ({ params: { id }, user, set }) => {
    const rbac = await getRBACContext(user as UserPayload);
    const existing = await db.query.finances.findFirst({
      where: eq(finances.id, parseInt(id))
    });

    if (existing && rbac.allowedProjectIds !== null && !rbac.allowedProjectIds.includes(existing.projectId)) {
      set.status = 403;
      return { success: false, message: 'Forbidden' };
    }

    await db.delete(finances).where(eq(finances.id, parseInt(id)));
    return { success: true, message: 'Financial record deleted successfully' };
  });
