import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { getUserById, updateAuthorStatus } from '../services/user.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (!params.id) return errorResponse(new Error('Author ID is required'), { status: 400 });

  try {
    await requireRole(request, [ROLES.ADMIN]);
    const author = await getUserById(params.id);
    if (!author || author.role !== ROLES.AUTHOR) {
      return errorResponse(new Error('Author not found'), { status: 404 });
    }
    return jsonResponse(author);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (!params.id) return errorResponse(new Error('Author ID is required'), { status: 400 });

  try {
    await requireRole(request, [ROLES.ADMIN]);

    if (request.method === 'PATCH') {
      const payload = await parseRequestBody(request) as { authorStatus?: string };
      if (!payload.authorStatus) {
        return errorResponse(new Error('authorStatus is required'), { status: 400 });
      }
      const author = await updateAuthorStatus(params.id, payload.authorStatus as any);
      return jsonResponse(author);
    }

    return methodNotAllowed(request.method, ['PATCH']);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
