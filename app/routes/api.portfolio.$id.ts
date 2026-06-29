import { type LoaderFunctionArgs } from 'react-router';
import { prisma } from '../lib/db.server';
import { jsonResponse, errorResponse } from '../lib/api.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return errorResponse(new Error('Portfolio ID is required'), { status: 400 });
  }

  try {
    const project = await prisma.portfolio.findUnique({
      where: { 
        id,
        deletedAt: null 
      },
      select: {
        id: true,
        title: true,
        description: true,
        architectureDiagram: true,
        techStack: true,
        githubLink: true,
        demoLink: true,
        caseStudy: true,
        category: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            profile: {
              select: {
                displayName: true,
                slug: true,
                avatar: true,
                bio: true,
                socialLinks: true,
              }
            }
          }
        }
      }
    });

    if (!project) {
      return errorResponse(new Error('Portfolio project not found'), { status: 404 });
    }

    return jsonResponse(project);
  } catch (error: any) {
    return errorResponse(error, { status: 500 });
  }
}
