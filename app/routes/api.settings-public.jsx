import prisma from "../db.server";

const DEFAULT_SETTINGS = {
  enableFBT: true,
  enableBundles: true,
  enableVolume: true,
  enableCartUpsell: false,
  fbtTitle: "Frequently Bought Together",
  fbtMaxProducts: 4,
  fbtShowSavings: true,
  bundleTitle: "Build Your Bundle",
  bundleMaxItems: 6,
  primaryColor: "#008060",
  textColor: "#202223",
  backgroundColor: "#ffffff",
  borderRadius: 8,
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  });

  if (!shop) return Response.json(DEFAULT_SETTINGS, { headers });

  const [settings, fbt, bundles, discounts] = await Promise.all([
    prisma.shopSettings.findUnique({ where: { shop } }),
    productId
      ? prisma.frequentlyBoughtTogether.findUnique({
          where: { shop_productId: { shop, productId } },
        })
      : null,
    prisma.bundle.findMany({
      where: { shop, status: "active" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.volumeDiscount.findMany({
      where: { shop, status: "active" },
    }),
  ]);

  return Response.json(
    {
      settings: settings || DEFAULT_SETTINGS,
      fbt: fbt ? { ...fbt, relatedProducts: JSON.parse(fbt.relatedProducts || "[]") } : null,
      bundles: bundles.map((b) => ({
        ...b,
        products: JSON.parse(b.products || "[]"),
        tiers: JSON.parse(b.tiers || "[]"),
      })),
      discounts: discounts.map((d) => ({
        ...d,
        tiers: JSON.parse(d.tiers || "[]"),
        productIds: JSON.parse(d.productIds || "[]"),
        collectionIds: JSON.parse(d.collectionIds || "[]"),
      })),
    },
    { headers },
  );
}
