import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { createPortfolioProject, listPublicPortfolio } from '../services/portfolio.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined;
  const username = url.searchParams.get('author');

  try {
    const projects = await listPublicPortfolio({ category, author: username, limit });
    return jsonResponse(projects, { meta: { count: projects.length } });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return methodNotAllowed(request.method, ['POST']);
  }

  try {
    const user = await requireRole(request, [ROLES.ADMIN]);
    const payload = await parseRequestBody(request);
    const project = await createPortfolioProject(user.id, payload as any);
    return jsonResponse(project, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
