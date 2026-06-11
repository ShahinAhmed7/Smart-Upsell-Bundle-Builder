import { unauthenticated } from "../shopify.server";

export async function loader({ request }) {
  await unauthenticated.admin(request);
  return null;
}
