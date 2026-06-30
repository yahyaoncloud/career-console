import { type User } from '@prisma/client';
import { requireUser } from '../lib/auth.server';
import { ROLES } from '../constants/roles';

export function forbidden(message = 'Forbidden'): never {
  throw new Response(message, { status: 403 });
}

export async function requireRole(request: Request, roles: Array<User['role']>) {
  const user = await requireUser(request);

  if (!roles.includes(user.role)) {
    forbidden('You are not authorized to access this resource.');
  }

  return user;
}

export async function requireActiveAuthor(request: Request) {
  const user = await requireRole(request, [ROLES.AUTHOR, ROLES.ADMIN]);

  if (user.role === ROLES.AUTHOR && user.authorStatus !== 'ACTIVE') {
    forbidden('Your author access is not active.');
  }

  return user;
}

export function assertSelfOrAdmin(currentUser: User, resourceUserId: string) {
  if (currentUser.role !== ROLES.ADMIN && currentUser.id !== resourceUserId) {
    forbidden('You can only manage your own resources.');
  }
}

export function assertFirebaseSelfOrAdmin(currentUser: User, firebaseUid: string) {
  if (currentUser.role !== ROLES.ADMIN && currentUser.firebaseUid !== firebaseUid) {
    forbidden('You can only manage your own resources.');
  }
}

export function assertAdmin(currentUser: User) {
  if (currentUser.role !== ROLES.ADMIN) {
    forbidden('Admin access required.');
  }
}

