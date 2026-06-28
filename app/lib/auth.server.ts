import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { redirect } from 'react-router';
import { getSession } from './session.server';
import { prisma } from './db.server';

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
    throw redirect("/login");
  }

  // Optionally verify token if we stored it instead of UID, 
  // but for basic session, reading from signed React Router cookie is enough.

  const dbUser = await prisma.user.findUnique({
    where: { firebaseUid }
  });

  if (!dbUser) {
    throw redirect("/login");
  }

  return dbUser;
}

/**
 * Returns the authenticated user if they are an ADMIN, else redirects.
 */
export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  
  if (user.role !== 'ADMIN') {
    throw redirect("/dashboard");
  }

  return user;
}
