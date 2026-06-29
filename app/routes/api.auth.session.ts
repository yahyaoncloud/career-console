import { ActionFunctionArgs, data } from "react-router";
import { getAuth } from "firebase-admin/auth";
import { commitSession, getSession } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { ROLES } from "~/constants/roles";
import { type ActionResult } from "~/types/types";
import { checkRateLimit } from "~/lib/rate-limit.server";
import { jsonResponse, errorResponse } from "~/lib/api.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return errorResponse(new Error("Method not allowed"), { status: 405 });
  }

  const formData = await request.formData();
  const idToken = formData.get("idToken")?.toString();

  if (!idToken) {
    return errorResponse(new Error("Missing ID token"), { status: 400 });
  }

  // Rate Limiting (10 requests per minute per IP to prevent brute force)
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = await checkRateLimit(`auth_${ip}`, 10);
  if (!allowed) {
    return errorResponse(new Error("Rate limit exceeded"), { status: 429, message: "Too many login attempts. Please try again later." });
  }

  try {
    // 1. Verify token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";

    // 2. Ensure user exists in Prisma (create if missing, based on old logic)
    let dbUser = await prisma.user.findUnique({ where: { firebaseUid } });
    
    const intent = formData.get("intent")?.toString();
    const inviteCode = formData.get("inviteCode")?.toString();
    const validInviteCode = process.env.ADMIN_INVITE_CODE || 'yahyaoncloud';
    
    if (!dbUser) {
      let assignedRole = ROLES.AUTHOR;
      
      // Auto-promote specific email
      if (email === 'ykinwork1@gmail.com') {
        assignedRole = ROLES.ADMIN;
      } 
      // Handle explicit admin setup with valid invite code
      else if (intent === 'admin-setup') {
        if (inviteCode === validInviteCode) {
          assignedRole = ROLES.ADMIN;
        } else {
          // If they tried admin setup but code is wrong, fail the creation entirely
          return errorResponse(new Error("Invalid admin invite code"), { status: 403 });
        }
      }

      dbUser = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          role: assignedRole,
        }
      });
    }

    // 3. Set the session cookie
    const session = await getSession(request.headers.get("Cookie"));
    session.set("firebaseUid", firebaseUid);

    return jsonResponse(
      { role: dbUser.role, userId: dbUser.id },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  } catch (error: any) {
    console.error("Auth session creation failed:", error);
    return errorResponse(error, { status: 401, message: "Invalid token" });
  }
}
