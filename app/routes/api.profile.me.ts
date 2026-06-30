import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { requireUser } from '../lib/auth.server';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { getUserById } from '../services/user.server';
import { updateOwnProfile } from '../services/profile.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    const fullUser = await getUserById(user.id);
    return jsonResponse(fullUser?.profile || null);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'PATCH') {
    return methodNotAllowed(request.method, ['PATCH']);
  }

  try {
    const user = await requireUser(request);
    const payload = await parseRequestBody(request);
    const profile = await updateOwnProfile(user.id, payload as any);
    return jsonResponse(profile);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
