import { type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { listAuthors } from '../services/user.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await requireRole(request, [ROLES.ADMIN]);
    const authors = await listAuthors();
    return jsonResponse(authors, { meta: { count: authors.length } });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
