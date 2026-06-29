import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { type ActionResult } from "~/types/types";

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

    return Response.json({ 
      success: true, 
      data: { notifications, unreadCount } 
    } satisfies ActionResult);
  } catch (error: any) {
    return Response.json({
      success: false,
      error: "Failed to fetch notifications",
      message: error.message
    } satisfies ActionResult, { status: 500 });
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
      return Response.json({ success: false, error: "Invalid intent" } satisfies ActionResult, { status: 400 });
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

    return Response.json({ 
      success: true, 
      data: { notifications, unreadCount } 
    } satisfies ActionResult);
  } catch (error: any) {
    return Response.json({
      success: false,
      error: "Failed to process notification action",
      message: error.message
    } satisfies ActionResult, { status: 500 });
  }
}
