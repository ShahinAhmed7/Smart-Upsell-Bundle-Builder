import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);
  switch (topic) {
    case "APP_UNINSTALLED":
      if (shop) {
        await prisma.bundle.deleteMany({ where: { shop } });
        await prisma.volumeDiscount.deleteMany({ where: { shop } });
        await prisma.shopSettings.deleteMany({ where: { shop } });
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
