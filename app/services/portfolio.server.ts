import { z } from 'zod';
import { prisma } from '../lib/db.server';
import { getCache, setCache, clearCache, CACHE_TTL } from '../lib/cache.server';

export const PortfolioInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  architectureDiagram: z.string().optional().nullable(),
  techStack: z.array(z.string()).min(1).or(z.string().min(1)),
  githubLink: z.string().url().optional().or(z.literal('')).nullable(),
  demoLink: z.string().url().optional().or(z.literal('')).nullable(),
  caseStudy: z.string().optional().nullable(),
  category: z.string().min(1),
});

export type PortfolioInput = z.infer<typeof PortfolioInputSchema>;

function normalizePortfolioInput(input: PortfolioInput) {
  return {
    ...input,
    techStack: Array.isArray(input.techStack)
      ? input.techStack.map((item) => item.trim()).filter(Boolean)
      : input.techStack.split(',').map((item) => item.trim()).filter(Boolean),
    githubLink: input.githubLink || null,
    demoLink: input.demoLink || null,
    architectureDiagram: input.architectureDiagram || null,
    caseStudy: input.caseStudy || null,
  };
}

function normalizePortfolioPatch(input: Partial<PortfolioInput>) {
  const data: any = { ...input };

  if (input.techStack !== undefined) {
    data.techStack = Array.isArray(input.techStack)
      ? input.techStack.map((item) => item.trim()).filter(Boolean)
      : input.techStack.split(',').map((item) => item.trim()).filter(Boolean);
  }

  if (input.githubLink !== undefined) data.githubLink = input.githubLink || null;
  if (input.demoLink !== undefined) data.demoLink = input.demoLink || null;
  if (input.architectureDiagram !== undefined) data.architectureDiagram = input.architectureDiagram || null;
  if (input.caseStudy !== undefined) data.caseStudy = input.caseStudy || null;

  return data;
}

export async function listPublicPortfolio(options: { category?: string | null; author?: string | null; limit?: number } = {}) {
  const cacheKey = `portfolio:public:${options.category || 'all'}:${options.author || 'all'}:${options.limit || 50}`;
  const cached = getCache<any[]>(cacheKey);
  if (cached) return cached;

  const whereClause: any = {
    deletedAt: null,
  };

  if (options.category) whereClause.category = options.category;
  if (options.author) {
    whereClause.user = {
      profile: { slug: options.author },
    };
  }

  const projects = await prisma.portfolio.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: options.limit || 50,
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
            },
          },
        },
      },
    },
  });

  setCache(cacheKey, projects, CACHE_TTL.MEDIUM);
  return projects;
}

export async function getPortfolioProject(id: string) {
  return prisma.portfolio.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: {
        select: {
          name: true,
          profile: {
            select: {
              displayName: true,
              slug: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
}

export async function createPortfolioProject(userId: string, input: PortfolioInput) {
  const project = await prisma.portfolio.create({
    data: {
      ...normalizePortfolioInput(input),
      userId,
    },
  });
  clearCache();
  return project;
}

export async function updatePortfolioProject(id: string, input: Partial<PortfolioInput>) {
  const parsed = PortfolioInputSchema.partial().parse(input);
  const project = await prisma.portfolio.update({
    where: { id },
    data: normalizePortfolioPatch(parsed),
  });
  clearCache();
  return project;
}

export async function archivePortfolioProject(id: string) {
  const project = await prisma.portfolio.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  clearCache();
  return project;
}
