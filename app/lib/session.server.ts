import { createCookieSessionStorage } from "react-router";

type SessionData = {
  firebaseUid: string;
  expiresAt?: string; // ISO timestamp for session expiry
};

type SessionFlashData = {
  error: string;
};

// Session TTL configuration (in seconds)
const SESSION_TTL = parseInt(process.env.SESSION_TTL || "3600"); // Default 1 hour
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days absolute max

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET || "s3cr3t"],
      secure: process.env.NODE_ENV === "production",
    },
  });

// Helper to create a session with expiry
export async function createSession(firebaseUid: string) {
  const session = await getSession();
  session.set("firebaseUid", firebaseUid);
  
  // Set session expiry timestamp
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  session.set("expiresAt", expiresAt);
  
  return session;
}

// Helper to check if session is expired
export function isSessionExpired(session: Awaited<ReturnType<typeof getSession>>) {
  const expiresAt = session.get("expiresAt");
  if (!expiresAt) return false;
  
  return new Date(expiresAt) < new Date();
}

// Helper to refresh session expiry (sliding session)
export async function refreshSession(session: Awaited<ReturnType<typeof getSession>>) {
  const newExpiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  session.set("expiresAt", newExpiresAt);
  return session;
}

// Helper to get remaining session time in seconds
export function getSessionTimeRemaining(session: Awaited<ReturnType<typeof getSession>>) {
  const expiresAt = session.get("expiresAt");
  if (!expiresAt) return SESSION_TTL;
  
  const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}

export { getSession, commitSession, destroySession };
export { SESSION_TTL };
