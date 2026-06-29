import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { type ActionResult } from "~/types/types";
import { jsonResponse, errorResponse } from "~/lib/api.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireUser(request);
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    });

    return jsonResponse({ notifications, unreadCount });
  } catch (error: any) {
    return errorResponse(error, { status: 500, message: "Failed to fetch notifications" });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "markRead") {
      const id = formData.get("id") as string;
      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { read: true }
      });
    } else if (intent === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true }
      });
    } else if (intent === "dismiss") {
      const id = formData.get("id") as string;
      await prisma.notification.deleteMany({
        where: { id, userId: user.id }
      });
    } else if (intent === "dismissAll") {
      await prisma.notification.deleteMany({
        where: { userId: user.id }
      });
    } else {
      return errorResponse(new Error("Invalid intent"), { status: 400 });
    }

    // Refetch and return the updated state so the UI doesn't clear out
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    });

    return jsonResponse({ notifications, unreadCount });
  } catch (error: any) {
    return errorResponse(error, { status: 500, message: "Failed to process notification action" });
  }
}
