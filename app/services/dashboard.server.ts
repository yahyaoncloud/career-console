import { prisma } from '../lib/db.server';
import { ROLES } from '../constants/roles';

export async function getAdminOverview() {
  const [
    totalAuthors,
    activeAuthors,
    suspendedAuthors,
    portfolioProjects,
    guestbookEntries,
    unreadNotifications,
    recentNotifications,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null, role: ROLES.AUTHOR as any } }),
    prisma.user.count({ where: { deletedAt: null, role: ROLES.AUTHOR as any, authorStatus: 'ACTIVE' } }),
    prisma.user.count({ where: { deletedAt: null, role: ROLES.AUTHOR as any, authorStatus: 'SUSPENDED' } }),
    prisma.portfolio.count({ where: { deletedAt: null } }),
    prisma.guestbook.count({ where: { deletedAt: null } }),
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.user.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10, include: { profile: true } }),
  ]);

  return {
    totals: {
      totalAuthors,
      activeAuthors,
      suspendedAuthors,
      portfolioProjects,
      guestbookEntries,
      unreadNotifications,
    },
    recentNotifications,
    recentUsers,
  };
}

export async function getAuthorOverview(userId: string, firebaseUid: string) {
  const [profile, notifications, unreadCount] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    profile,
    notifications,
    unreadCount,
    blogOwnershipKey: firebaseUid,
  };
}

