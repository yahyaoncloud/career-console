import { type LoaderFunctionArgs } from 'react-router';
import { requireUser } from '../lib/auth.server';
import { jsonResponse, errorResponse } from '../lib/api.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    return jsonResponse({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      authorStatus: user.authorStatus,
      dashboardPath: user.role === 'ADMIN' ? '/dashboard' : `/author/${user.firebaseUid}/dashboard`,
    });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
