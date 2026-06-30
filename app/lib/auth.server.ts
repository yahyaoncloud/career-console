import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { redirect } from 'react-router';
import { getSession, commitSession, isSessionExpired, refreshSession, getSessionTimeRemaining } from './session.server';
import { prisma } from './db.server';
import { ROLES } from '../constants/roles';
import { ROUTES } from '../constants/routes';

if (!getApps().length) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'yahyaoncloud1'
  });
}

/**
 * Returns the authenticated user or redirects to login.
 */
export async function requireUser(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  const firebaseUid = session.get("firebaseUid");

  if (!firebaseUid) {
    throw redirect(ROUTES.PUBLIC.HOME);
  }

  // Check session expiry
  if (isSessionExpired(session)) {
    throw redirect(ROUTES.PUBLIC.HOME);
  }

  // Optionally verify token if we stored it instead of UID, 
  // but for basic session, reading from signed React Router cookie is enough.

  const dbUser = await prisma.user.findUnique({
    where: { firebaseUid }
  });

  if (!dbUser) {
    throw redirect(ROUTES.PUBLIC.HOME);
  }

  // Refresh session expiry (sliding session)
  const refreshedSession = await refreshSession(session);
  const cookie = await commitSession(refreshedSession);
  
  // Note: In a real implementation, you'd want to return the cookie header
  // to be set in the response. For now, we'll just update the session data.
  
  return dbUser;
}

export async function getOptionalUser(request: Request) {
  try {
    return await requireUser(request);
  } catch (error) {
    if (error instanceof Response && (error.status === 302 || error.status === 301)) {
      return null;
    }

    throw error;
  }
}

/**
 * Returns the authenticated user if they are an ADMIN, else redirects.
 */
export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  
  if (user.role !== ROLES.ADMIN) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return user;
}
