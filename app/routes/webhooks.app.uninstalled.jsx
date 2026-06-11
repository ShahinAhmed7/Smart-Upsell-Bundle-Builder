import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { shop } = await authenticate.webhook(request);
  if (shop) {
    await prisma.bundle.deleteMany({ where: { shop } });
    await prisma.volumeDiscount.deleteMany({ where: { shop } });
    await prisma.shopSettings.deleteMany({ where: { shop } });
  }
  return new Response();
};
