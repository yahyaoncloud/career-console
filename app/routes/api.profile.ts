import { type LoaderFunctionArgs } from 'react-router';
import { prisma } from '../lib/db.server';
import { jsonResponse, errorResponse } from '../lib/api.server';
import { getCache, setCache, CACHE_TTL } from '../lib/cache.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const cacheKey = `profile:${slug || 'default'}`;

    // Try to get from cache first
    const cached = getCache(cacheKey);
    if (cached) {
      return jsonResponse(cached);
    }

    let profile;

    if (slug) {
      profile = await prisma.profile.findUnique({
        where: { slug },
        include: { user: { select: { name: true } } }
      });
    } else {
      // Default to the primary user if no slug is provided
      const user = await prisma.user.findFirst({
        where: { 
          deletedAt: null,
          profile: { isNot: null }
        },
        include: { profile: true }
      });
      if (user && user.profile) {
        profile = { ...user.profile, user: { name: user.name } };
      }
    }

    if (!profile) {
      return errorResponse(new Error('Profile not found'), { status: 404 });
    }

    // Cache the result for 5 minutes
    setCache(cacheKey, profile, CACHE_TTL.LONG);

    return jsonResponse(profile);
  } catch (error: any) {
    return errorResponse(error, { status: 500 });
  }
}
