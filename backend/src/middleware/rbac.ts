import { db } from '../db';
import { userProjects, userUnits } from '../db/schema';
import { eq } from 'drizzle-orm';

export type UserPayload = {
  id: number;
  role: 'super_admin' | 'admin_villa' | 'investor';
};

export type RBACContext = {
  allowedProjectIds: number[] | null; // null means all (super_admin)
  allowedUnitIds: number[] | null;    // null means all (super_admin)
};

/**
 * Fetch allowed project/unit IDs for the current user.
 * - super_admin: null (unrestricted)
 * - admin_villa: restricted to assigned projects (and all units within)
 * - investor: restricted to assigned units only
 */
export async function getRBACContext(user: UserPayload): Promise<RBACContext> {
  if (user.role === 'super_admin') {
    return { allowedProjectIds: null, allowedUnitIds: null };
  }

  if (user.role === 'admin_villa') {
    const projects = await db.query.userProjects.findMany({
      where: eq(userProjects.userId, user.id),
    });
    const projectIds = projects.map(p => p.projectId);
    return { allowedProjectIds: projectIds, allowedUnitIds: null };
  }

  if (user.role === 'investor') {
    const units = await db.query.userUnits.findMany({
      where: eq(userUnits.userId, user.id),
    });
    const unitIds = units.map(u => u.unitId);
    return { allowedProjectIds: null, allowedUnitIds: unitIds };
  }

  return { allowedProjectIds: [], allowedUnitIds: [] };
}

/**
 * Check if a specific project ID is allowed for this user.
 */
export function isProjectAllowed(rbac: RBACContext, projectId: number): boolean {
  if (rbac.allowedProjectIds === null) return true; // unrestricted
  return rbac.allowedProjectIds.includes(projectId);
}

/**
 * Check if a specific unit ID is allowed for this user.
 */
export function isUnitAllowed(rbac: RBACContext, unitId: number): boolean {
  if (rbac.allowedUnitIds === null) return true; // unrestricted
  return rbac.allowedUnitIds.includes(unitId);
}
