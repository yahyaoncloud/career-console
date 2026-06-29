import { ActionFunctionArgs, data } from "react-router";
import { getAuth } from "firebase-admin/auth";
import { commitSession, getSession } from "~/lib/session.server";
import { prisma } from "~/lib/db.server";
import { type ActionResult } from "~/types/types";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ success: false, error: "Method not allowed" } satisfies ActionResult, { status: 405 });
  }

  const formData = await request.formData();
  const idToken = formData.get("idToken")?.toString();

  if (!idToken) {
    return data({ success: false, error: "Missing ID token" } satisfies ActionResult, { status: 400 });
  }

  try {
    // 1. Verify token with Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";

    // 2. Ensure user exists in Prisma (create if missing, based on old logic)
    let dbUser = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          role: email === 'ykinwork1@gmail.com' ? "ADMIN" : "AUTHOR",
        }
      });
    }

    // 3. Set the session cookie
    const session = await getSession(request.headers.get("Cookie"));
    session.set("firebaseUid", firebaseUid);

    return data(
      { success: true, data: { role: dbUser.role, userId: dbUser.id } } satisfies ActionResult,
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  } catch (error: any) {
    console.error("Auth session creation failed:", error);
    return data({ success: false, error: "Invalid token", message: error.message } satisfies ActionResult, { status: 401 });
  }
}
