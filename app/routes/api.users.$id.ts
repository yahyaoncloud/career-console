import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { getUserById, softDeleteUser, updateAuthorStatus, updateUserRole } from '../services/user.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (!params.id) return errorResponse(new Error('User ID is required'), { status: 400 });

  try {
    await requireRole(request, [ROLES.ADMIN]);
    const user = await getUserById(params.id);
    if (!user) return errorResponse(new Error('User not found'), { status: 404 });
    return jsonResponse(user);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (!params.id) return errorResponse(new Error('User ID is required'), { status: 400 });

  try {
    const currentUser = await requireRole(request, [ROLES.ADMIN]);

    if (request.method === 'PATCH') {
      const payload = await parseRequestBody(request) as { role?: string; authorStatus?: string };
      let user = payload.role ? await updateUserRole(params.id!, payload.role) : await getUserById(params.id!);
      if (payload.authorStatus) user = await updateAuthorStatus(params.id!, payload.authorStatus as any);
      return jsonResponse(user);
    }

    if (request.method === 'DELETE') {
      if (currentUser.id === params.id) {
        return errorResponse(new Error('Admins cannot delete their own account from this endpoint.'), { status: 400 });
      }
      const user = await softDeleteUser(params.id);
      return jsonResponse(user);
    }

    return methodNotAllowed(request.method, ['PATCH', 'DELETE']);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
