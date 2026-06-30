import { z } from 'zod';
import { prisma } from '../lib/db.server';
import { getCache, setCache, clearCache, CACHE_TTL } from '../lib/cache.server';

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  bio: z.string().max(1000).optional().nullable(),
  avatar: z.string().max(1000).optional().nullable(),
  coverImage: z.string().max(1000).optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  theme: z.record(z.string(), z.any()).optional(),
  guestbookEnabled: z.boolean().optional(),
  analyticsEnabled: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export async function getPublicProfile(slug?: string | null) {
  const cacheKey = `profile:${slug || 'default'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let profile;

  if (slug) {
    profile = await prisma.profile.findUnique({
      where: { slug },
      include: { user: { select: { id: true, name: true, role: true, authorStatus: true } } },
    });
  } else {
    const user = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        profile: { isNot: null },
      },
      include: { profile: true },
    });
    profile = user?.profile ? { ...user.profile, user: { id: user.id, name: user.name, role: user.role, authorStatus: user.authorStatus } } : null;
  }

  if (profile) {
    setCache(cacheKey, profile, CACHE_TTL.LONG);
  }

  return profile;
}

export async function updateOwnProfile(userId: string, input: ProfileUpdateInput) {
  const cleanWebsite = input.website === '' ? null : input.website;
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: input.displayName || 'Author',
      slug: input.slug || `author-${userId.slice(0, 8)}`,
      bio: input.bio || null,
      avatar: input.avatar || null,
      coverImage: input.coverImage || null,
      website: cleanWebsite || null,
      socialLinks: input.socialLinks || {},
      theme: input.theme || {},
      guestbookEnabled: input.guestbookEnabled ?? true,
      analyticsEnabled: input.analyticsEnabled ?? true,
    },
    update: {
      ...input,
      website: cleanWebsite,
    },
  });

  clearCache();
  return profile;
}

