import { type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { requireActiveAuthor } from '../policies/authz.server';
import { listBlogs } from '../services/blog.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireActiveAuthor(request);
    const blogs = await listBlogs({ publicOnly: false, authorFirebaseUid: user.firebaseUid });
    return jsonResponse(blogs, { meta: { count: blogs.length } });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
