import { prisma } from '../lib/db.server';
import { ROLES } from '../constants/roles';

export async function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { profile: true },
  });
}

export async function getUserByFirebaseUid(firebaseUid: string) {
  return prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    include: { profile: true },
  });
}

export async function updateUserRole(id: string, role: keyof typeof ROLES | string) {
  return prisma.user.update({
    where: { id },
    data: { role: role as any },
  });
}

export async function updateAuthorStatus(id: string, authorStatus: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'PENDING' | 'NONE') {
  return prisma.user.update({
    where: { id },
    data: { authorStatus },
  });
}

export async function softDeleteUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function listAuthors() {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { in: [ROLES.AUTHOR, ROLES.ADMIN] as any },
    },
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });
}

