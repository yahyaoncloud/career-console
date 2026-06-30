import { prisma } from '../lib/db.server';

export async function getNotificationState(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
  return getNotificationState(userId);
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return getNotificationState(userId);
}

export async function dismissNotification(userId: string, id: string) {
  await prisma.notification.deleteMany({
    where: { id, userId },
  });
  return getNotificationState(userId);
}

export async function dismissAllNotifications(userId: string) {
  await prisma.notification.deleteMany({
    where: { userId },
  });
  return getNotificationState(userId);
}

export async function broadcastNotification(input: {
  title: string;
  message: string;
  type?: string;
  link?: string;
  role?: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(input.role ? { role: input.role as any } : {}),
    },
  });

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: input.title,
      message: input.message,
      type: (input.type || 'INFO') as any,
      link: input.link || null,
    })),
  });

  return { sent: users.length };
}
