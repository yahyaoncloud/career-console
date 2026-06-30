import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireActiveAuthor } from '../policies/authz.server';
import { createBlog, listBlogs } from '../services/blog.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const publicOnly = url.searchParams.get('scope') !== 'all';
  const authorFirebaseUid = url.searchParams.get('authorFirebaseUid') || undefined;

  try {
    const blogs = await listBlogs({ publicOnly, authorFirebaseUid });
    return jsonResponse(blogs, { meta: { count: blogs.length } });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return errorResponse(err, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return methodNotAllowed(request.method, ['POST']);
  }

  try {
    const user = await requireActiveAuthor(request);
    const payload = await parseRequestBody(request);
    const blog = await createBlog(user, payload as any);
    return jsonResponse(blog, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
