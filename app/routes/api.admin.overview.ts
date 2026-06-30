import { type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { getAdminOverview } from '../services/dashboard.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await requireRole(request, [ROLES.ADMIN]);
    const overview = await getAdminOverview();
    return jsonResponse(overview);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
