import { redirect } from "react-router";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) return redirect("/");
  throw redirect(await login(request));
};
