import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { redirect, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { authenticate, PRO_PLAN_NAME } from "../shopify.server";

async function getBillingStatus(billing, isTest) {
  const billingCheck = await billing.check({ plans: [PRO_PLAN_NAME], isTest });
  const activeSubscription = billingCheck.appSubscriptions?.[0] || null;
  return { hasProPlan: Boolean(activeSubscription), activeSubscription };
}

export async function loader({ request }) {
  const { admin, billing, session } = await authenticate.admin(request);
  const isTest = (await admin.graphql(`{ shop { plan { partnerDevelopment } } }`))
    .json().then((d) => d.data?.shop?.plan?.partnerDevelopment === true);
  const { hasProPlan, activeSubscription } = await getBillingStatus(billing, isTest);
  return { planName: hasProPlan ? PRO_PLAN_NAME : "Free Plan", hasProPlan, subscriptionId: activeSubscription?.id || null, isTest };
}

export async function action({ request }) {
  const { admin, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "downgrade") {
    const isTest = (await admin.graphql(`{ shop { plan { partnerDevelopment } } }`))
      .json().then((d) => d.data?.shop?.plan?.partnerDevelopment === true);
    const { activeSubscription } = await getBillingStatus(billing, isTest);
    if (activeSubscription?.id) {
      await billing.cancel({ subscriptionId: activeSubscription.id, isTest, prorate: true });
    }
    return redirect("/app/billing?status=downgraded");
  }
  return redirect("/app/billing");
}

export default function BillingPage() {
  const { planName, hasProPlan, subscriptionId, isTest } = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [upgradeState, setUpgradeState] = useState({ loading: false, error: "" });
  const [downgradeState, setDowngradeState] = useState({ loading: false, error: "" });
  const status = searchParams.get("status");

  async function postBillingIntent(intent) {
    await shopify.ready;
    const body = new FormData();
    body.set("intent", intent);
    const token = await shopify.idToken();
    const response = await fetch("/api/billing", {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
      body,
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || "Billing failed");
    return result;
  }

  async function handleUpgrade() {
    setUpgradeState({ loading: true, error: "" });
    try {
      const result = await postBillingIntent("upgrade");
      if (result.confirmationUrl) {
        const url = new URL(result.confirmationUrl);
        if (url.hostname.endsWith(".shopify.com") || url.hostname === "shopify.com") {
          window.open(result.confirmationUrl, "_top");
        }
      }
    } catch (error) {
      setUpgradeState({ loading: false, error: error.message });
    }
  }

  async function handleDowngrade() {
    setDowngradeState({ loading: true, error: "" });
    try {
      await postBillingIntent("downgrade");
      navigate("/app/billing?status=downgraded");
    } catch (error) {
      setDowngradeState({ loading: false, error: error.message });
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <p style={styles.eyebrow}>Current plan</p>
        <h1 style={styles.heading}>{planName}</h1>
        {isTest && <p style={styles.testBadge}>Test billing mode</p>}
      </section>

      {status === "approved" && <div style={styles.successBox}>Pro plan is active.</div>}
      {status === "downgraded" && <div style={styles.successBox}>Free plan is active.</div>}
      {upgradeState.error && <div style={styles.errorBox}>{upgradeState.error}</div>}

      <section style={styles.grid}>
        <article style={styles.card}>
          <h2 style={styles.cardTitle}>Free Plan</h2>
          <p style={styles.price}>$0/month</p>
          <ul style={styles.list}>
            <li>3 bundles</li>
            <li>Frequently Bought Together widget</li>
            <li>Basic volume discounts</li>
            <li>Standard styling</li>
          </ul>
          {hasProPlan ? (
            <button type="button" onClick={handleDowngrade} disabled={downgradeState.loading} style={styles.secondaryButton}>
              {downgradeState.loading ? "Downgrading..." : "Downgrade to Free"}
            </button>
          ) : (
            <p style={styles.activeLabel}>Active</p>
          )}
        </article>

        <article style={{ ...styles.card, ...styles.highlightedCard }}>
          <h2 style={styles.cardTitle}>Pro Plan</h2>
          <p style={styles.price}>$9.99/month</p>
          <ul style={styles.list}>
            <li>Unlimited bundles</li>
            <li>Cart drawer upsell</li>
            <li>Advanced volume discount tiers</li>
            <li>Custom CSS & priority support</li>
            <li>7-day free trial</li>
          </ul>
          {hasProPlan ? (
            <p style={styles.activeLabel}>Active</p>
          ) : (
            <button type="button" onClick={handleUpgrade} disabled={upgradeState.loading} style={styles.primaryButton}>
              {upgradeState.loading ? "Opening Shopify billing..." : "Start 7-Day Free Trial"}
            </button>
          )}
        </article>
      </section>

      {subscriptionId && <p style={styles.subscriptionNote}>Subscription ID: {subscriptionId}</p>}
    </main>
  );
}

const styles = {
  page: { padding: "2rem", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" },
  header: { marginBottom: "1.5rem" },
  eyebrow: { color: "#5c5f62", fontSize: "14px", margin: "0 0 4px" },
  heading: { fontSize: "28px", margin: "0 0 8px" },
  testBadge: { display: "inline-block", marginTop: "12px", padding: "4px 8px", borderRadius: "6px", background: "#fff4e5", color: "#7c4a00", fontSize: "13px" },
  successBox: { background: "#eafaf3", border: "1px solid #9de0c5", borderRadius: "8px", color: "#005c3f", marginBottom: "1rem", padding: "12px 16px" },
  errorBox: { background: "#fff4f4", border: "1px solid #ffd0d0", borderRadius: "8px", color: "#8a0000", marginBottom: "1rem", padding: "12px 16px" },
  grid: { display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" },
  card: { border: "1px solid #e0e0e0", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "340px", padding: "24px" },
  highlightedCard: { border: "2px solid #008060" },
  cardTitle: { fontSize: "22px", margin: "0 0 18px" },
  price: { fontSize: "28px", fontWeight: "bold", margin: "0 0 20px" },
  list: { lineHeight: "1.5", margin: "0", paddingLeft: "20px" },
  primaryButton: { width: "100%", padding: "12px", background: "#008060", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  secondaryButton: { width: "100%", padding: "12px", background: "white", color: "#202223", border: "1px solid #c9cccf", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  activeLabel: { alignSelf: "flex-start", background: "#eafaf3", borderRadius: "6px", color: "#005c3f", fontWeight: "bold", margin: "0", padding: "8px 12px" },
  subscriptionNote: { color: "#6d7175", fontSize: "12px", marginTop: "16px", wordBreak: "break-all" },
};
