import { ActionFunctionArgs, redirect } from "react-router";
import { destroySession, getSession } from "~/lib/session.server";
import { ROUTES } from "~/constants/routes";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect(ROUTES.AUTH.LOGIN, {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
