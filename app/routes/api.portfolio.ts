import { type LoaderFunctionArgs } from 'react-router';
import { prisma } from '../lib/db.server';
import { jsonResponse, errorResponse } from '../lib/api.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined;
  const username = url.searchParams.get('author');

  try {
    const whereClause: any = {
      deletedAt: null,
    };

    if (category) {
      whereClause.category = category;
    }

    if (username) {
      whereClause.user = {
        profile: {
          slug: username
        }
      };
    }

    const projects = await prisma.portfolio.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit || 50, // default limit to prevent over-fetching
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
              }
            }
          }
        }
      }
    });

    return jsonResponse(projects, { meta: { count: projects.length } });
  } catch (error: any) {
    return errorResponse(error, { status: 500 });
  }
}
