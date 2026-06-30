import { type ActionFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { broadcastNotification } from '../services/notification.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return methodNotAllowed(request.method, ['POST']);
  }

  try {
    await requireRole(request, [ROLES.ADMIN]);
    const payload = await parseRequestBody(request) as { title?: string; message?: string; type?: string; link?: string; role?: string };
    if (!payload.title || !payload.message) {
      return errorResponse(new Error('title and message are required'), { status: 400 });
    }

    const result = await broadcastNotification({
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link,
      role: payload.role,
    });
    return jsonResponse(result, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
