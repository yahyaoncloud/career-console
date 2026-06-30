import { type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { requireActiveAuthor } from '../policies/authz.server';
import { getAuthorOverview } from '../services/dashboard.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireActiveAuthor(request);
    const overview = await getAuthorOverview(user.id, user.firebaseUid);
    return jsonResponse(overview);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
