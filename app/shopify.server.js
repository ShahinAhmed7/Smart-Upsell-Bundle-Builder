import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const TOML_CLIENT_ID = "REPLACE_WITH_YOUR_CLIENT_ID";
const DEFAULT_APP_URL = "https://smart-upsell-bundle-builder-production.up.railway.app";
const envApiKey = process.env.SHOPIFY_API_KEY;
const scopes = (process.env.SCOPES || "")
  .split(",")
  .map((scope) => scope.trim())
  .filter(Boolean);

export const SHOPIFY_API_KEY =
  envApiKey && envApiKey !== "YOUR_API_KEY" ? envApiKey : TOML_CLIENT_ID;
export const PRO_PLAN_NAME = "Pro Plan";
export const FREE_BUNDLE_LIMIT = 3;

const shopify = shopifyApp({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes,
  appUrl: process.env.SHOPIFY_APP_URL || DEFAULT_APP_URL,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
    APP_SCOPES_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/scopes_update",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  future: {
    expiringOfflineAccessTokens: true,
  },
  billing: {
    [PRO_PLAN_NAME]: {
      lineItems: [
        {
          amount: 9.99,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 7,
      replacementBehavior: "APPLY_IMMEDIATELY",
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
