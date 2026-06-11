import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { SHOPIFY_API_KEY, authenticate, registerWebhooks } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  await registerWebhooks({ session });
  return { apiKey: SHOPIFY_API_KEY };
};

export default function App() {
  const { apiKey } = useLoaderData();
  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/bundles">Bundles</s-link>
        <s-link href="/app/discounts">Discounts</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="/app/billing">Pricing</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
