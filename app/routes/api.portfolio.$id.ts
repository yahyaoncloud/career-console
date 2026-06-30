import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { parseRequestBody, methodNotAllowed } from '../lib/request.server';
import { requireRole } from '../policies/authz.server';
import { ROLES } from '../constants/roles';
import { archivePortfolioProject, getPortfolioProject, updatePortfolioProject } from '../services/portfolio.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return errorResponse(new Error('Portfolio ID is required'), { status: 400 });
  }

  try {
    const project = await getPortfolioProject(id);
    if (!project) {
      return errorResponse(new Error('Portfolio project not found'), { status: 404 });
    }

    return jsonResponse(project);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  if (!id) return errorResponse(new Error('Portfolio ID is required'), { status: 400 });

  try {
    await requireRole(request, [ROLES.ADMIN]);

    if (request.method === 'PATCH') {
      const payload = await parseRequestBody(request);
      const project = await updatePortfolioProject(id, payload as any);
      return jsonResponse(project);
    }

    if (request.method === 'DELETE') {
      const project = await archivePortfolioProject(id);
      return jsonResponse(project);
    }

    return methodNotAllowed(request.method, ['PATCH', 'DELETE']);
  } catch (error: any) {
    if (error instanceof Response) throw error;
    return errorResponse(error, { status: 500 });
  }
}
