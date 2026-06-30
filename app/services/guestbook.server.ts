import { z } from 'zod';
import { prisma } from '../lib/db.server';
import { getCache, setCache, clearCache, CACHE_TTL } from '../lib/cache.server';
import { sanitizeString } from '../lib/sanitize';

export const GuestbookInputSchema = z.object({
  name: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
});

export async function listGuestbookEntries() {
  const cached = getCache<any[]>('guestbook:entries');
  if (cached) return cached;

  const entries = await prisma.guestbook.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      message: true,
      createdAt: true,
      userId: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  setCache('guestbook:entries', entries, CACHE_TTL.SHORT);
  return entries;
}

export async function createGuestbookEntry(input: z.infer<typeof GuestbookInputSchema>, userId?: string | null) {
  const parsed = GuestbookInputSchema.parse(input);
  const entry = await prisma.guestbook.create({
    data: {
      userId: userId || null,
      name: sanitizeString(parsed.name),
      message: sanitizeString(parsed.message),
    },
  });

  clearCache('guestbook:entries');
  return entry;
}

export async function deleteGuestbookEntry(id: string) {
  const entry = await prisma.guestbook.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  clearCache('guestbook:entries');
  return entry;
}
