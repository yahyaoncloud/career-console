import { type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { prisma } from '../lib/db.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await requireRole(request, [ROLES.ADMIN]);
    await prisma.$queryRaw`SELECT 1`;
    return jsonResponse({ status: 'ok', database: 'ok', checkedAt: new Date().toISOString() });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
