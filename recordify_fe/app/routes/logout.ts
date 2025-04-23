import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { getSession, commitSession } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  
  session.flash("globalMessage", "로그아웃 성공!");
  session.unset("jwt");

  console.log("[Logout Action] Flashing message and unsetting JWT...");
  
  const sessionCookie = await commitSession(session);

  return redirect("/login", {
    headers: {
      "Set-Cookie": sessionCookie,
    },
  });
}
