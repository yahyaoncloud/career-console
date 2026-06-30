import { type ActionFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { methodNotAllowed } from '../lib/request.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { deleteGuestbookEntry } from '../services/guestbook.server';

export async function action({ request, params }: ActionFunctionArgs) {
  if (!params.id) return errorResponse(new Error('Guestbook entry ID is required'), { status: 400 });

  try {
    await requireRole(request, [ROLES.ADMIN]);
    if (request.method !== 'DELETE') {
      return methodNotAllowed(request.method, ['DELETE']);
    }

    const entry = await deleteGuestbookEntry(params.id);
    return jsonResponse(entry);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
