import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const headers = (headersArgs) => boundary.headers(headersArgs);

export default function BillingSuccess() {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/app/billing?status=approved");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main style={{ textAlign: "center", padding: "60px 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "28px", color: "#005c3f" }}>Subscription activated!</h1>
      <p style={{ color: "#5c5f62" }}>Redirecting you back to the app...</p>
    </main>
  );
}
