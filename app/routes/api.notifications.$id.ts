import { type ActionFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireUser } from '../lib/auth.server';
import { dismissNotification, markNotificationRead } from '../services/notification.server';

export async function action({ request, params }: ActionFunctionArgs) {
  if (!params.id) return errorResponse(new Error('Notification ID is required'), { status: 400 });

  try {
    const user = await requireUser(request);

    if (request.method === 'PATCH') {
      await parseRequestBody(request).catch(() => ({}));
      const state = await markNotificationRead(user.id, params.id);
      return jsonResponse(state);
    }

    if (request.method === 'DELETE') {
      const state = await dismissNotification(user.id, params.id);
      return jsonResponse(state);
    }

    return methodNotAllowed(request.method, ['PATCH', 'DELETE']);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
