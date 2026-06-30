import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireActiveAuthor } from '../policies/authz.server';
import { deleteBlog, getBlogBySlug, transitionBlog, updateBlog } from '../services/blog.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { slug } = params;
  if (!slug) {
    return errorResponse(new Error('Slug is required'), { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const publicOnly = url.searchParams.get('scope') !== 'all';
    const blog = await getBlogBySlug(slug, { publicOnly });
    if (!blog) {
      return errorResponse(new Error('Blog post not found'), { status: 404 });
    }

    return jsonResponse(blog);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { slug } = params;
  if (!slug) return errorResponse(new Error('Slug is required'), { status: 400 });

  try {
    const user = await requireActiveAuthor(request);

    if (request.method === 'PATCH') {
      const payload = await parseRequestBody(request);
      const next = payload.intent && payload.status
        ? await transitionBlog(user, slug, String(payload.status))
        : await updateBlog(user, slug, payload as any);
      return jsonResponse(next);
    }

    if (request.method === 'DELETE') {
      const result = await deleteBlog(user, slug);
      return jsonResponse(result);
    }

    return methodNotAllowed(request.method, ['PATCH', 'DELETE']);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
