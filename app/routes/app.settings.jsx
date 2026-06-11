import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate, PRO_PLAN_NAME } from "../shopify.server";
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
  cartUpsellTitle: "You might also like",
};

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const shopResponse = await admin.graphql(
    `#graphql
      query ShopBillingPlan {
        shop { plan { partnerDevelopment } }
      }
    `,
  );
  const shopPayload = await shopResponse.json();
  const isPartner = shopPayload.data?.shop?.plan?.partnerDevelopment === true;

  const billingResponse = await admin.graphql(
    `#graphql
      query ActiveSubscriptions {
        currentAppInstallation {
          activeSubscriptions { name status }
        }
      }
    `,
  );
  const billingPayload = await billingResponse.json();
  const hasProPlan = billingPayload.data?.currentAppInstallation?.activeSubscriptions?.some(
    (s) => s.name === PRO_PLAN_NAME && s.status === "ACTIVE",
  );

  const settings = await prisma.shopSettings.findUnique({
    where: { shop: session.shop },
  });

  return {
    settings: settings || { ...DEFAULT_SETTINGS, shop: session.shop },
    hasProPlan: Boolean(hasProPlan || isPartner),
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const data = {
      enableFBT: formData.get("enableFBT") === "true",
      enableBundles: formData.get("enableBundles") === "true",
      enableVolume: formData.get("enableVolume") === "true",
      enableCartUpsell: formData.get("enableCartUpsell") === "true",
      fbtTitle: formData.get("fbtTitle") || DEFAULT_SETTINGS.fbtTitle,
      fbtMaxProducts: parseInt(formData.get("fbtMaxProducts"), 10) || DEFAULT_SETTINGS.fbtMaxProducts,
      fbtShowSavings: formData.get("fbtShowSavings") === "true",
      bundleTitle: formData.get("bundleTitle") || DEFAULT_SETTINGS.bundleTitle,
      bundleMaxItems: parseInt(formData.get("bundleMaxItems"), 10) || DEFAULT_SETTINGS.bundleMaxItems,
      primaryColor: formData.get("primaryColor") || DEFAULT_SETTINGS.primaryColor,
      textColor: formData.get("textColor") || DEFAULT_SETTINGS.textColor,
      backgroundColor: formData.get("backgroundColor") || DEFAULT_SETTINGS.backgroundColor,
      borderRadius: parseInt(formData.get("borderRadius"), 10) || DEFAULT_SETTINGS.borderRadius,
      cartUpsellTitle: formData.get("cartUpsellTitle") || DEFAULT_SETTINGS.cartUpsellTitle,
    };

    await prisma.shopSettings.upsert({
      where: { shop: session.shop },
      update: data,
      create: { shop: session.shop, ...data },
    });
    return { success: true };
  }

  return null;
}

export default function SettingsPage() {
  const { settings, hasProPlan } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(settings);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleField(field) {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const body = new FormData();
    body.set("intent", "save");
    Object.entries(form).forEach(([k, v]) => body.set(k, String(v)));
    try {
      await shopify.ready;
      const token = await shopify.idToken();
      const response = await fetch("/app/settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Settings</h1>
        <p style={styles.copy}>Configure widget display and styling.</p>
        {!hasProPlan && (
          <div style={styles.planBadge}>
            <span>Free Plan</span>
            <button type="button" onClick={() => navigate("/app/billing")} style={styles.upgradeLink}>Upgrade to Pro</button>
          </div>
        )}
      </div>

      {saved && <div style={styles.successBanner}>Settings saved.</div>}

      <div style={styles.sections}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Enabled Widgets</h2>
          <ToggleField label="Frequently Bought Together" checked={form.enableFBT} onChange={() => toggleField("enableFBT")} />
          <ToggleField label="Product Bundles" checked={form.enableBundles} onChange={() => toggleField("enableBundles")} />
          <ToggleField label="Volume Discounts" checked={form.enableVolume} onChange={() => toggleField("enableVolume")} />
          <ProLockedField hasProPlan={hasProPlan}>
            <ToggleField label="Cart Drawer Upsell" checked={form.enableCartUpsell} onChange={() => toggleField("enableCartUpsell")} />
          </ProLockedField>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Widget Titles</h2>
          <label style={styles.label}>FBT title<input type="text" value={form.fbtTitle} onChange={(e) => updateField("fbtTitle", e.target.value)} style={styles.input} /></label>
          <label style={styles.label}>Bundle title<input type="text" value={form.bundleTitle} onChange={(e) => updateField("bundleTitle", e.target.value)} style={styles.input} /></label>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Colors</h2>
          <div style={styles.colorGrid}>
            <ColorField label="Primary color" value={form.primaryColor} onChange={(v) => updateField("primaryColor", v)} />
            <ColorField label="Text color" value={form.textColor} onChange={(v) => updateField("textColor", v)} />
            <ColorField label="Background color" value={form.backgroundColor} onChange={(v) => updateField("backgroundColor", v)} />
          </div>
        </section>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={() => navigate("/app")} style={styles.secondaryButton}>Cancel</button>
        <button type="submit" disabled={saving} style={styles.primaryButton}>{saving ? "Saving..." : "Save Settings"}</button>
      </div>
    </form>
  );
}

function ProLockedField({ hasProPlan, children }) {
  if (hasProPlan) return children;
  return (
    <div style={{ position: "relative" }} onClick={() => window.location.assign("/app/billing")}>
      {children}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.7)", cursor: "pointer", borderRadius: "6px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#5c5f62" }}>Pro feature</span>
      </div>
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ fontSize: "14px", fontWeight: 600 }}>{label}</span>
      <button type="button" onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", background: checked ? "#008060" : "#babfc3", position: "relative", padding: 0, cursor: "pointer" }}>
        <span style={{ position: "absolute", top: "2px", left: checked ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#ffffff", transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: 600 }}>
      {label}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "40px", height: "40px", border: "1px solid #c9cccf", borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, padding: "8px 12px", border: "1px solid #c9cccf", borderRadius: "6px", fontSize: "14px", fontFamily: "monospace" }} />
      </div>
    </label>
  );
}

const styles = {
  page: { maxWidth: "800px", margin: "0 auto", padding: "2rem", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" },
  header: { marginBottom: "1.5rem" },
  heading: { fontSize: "28px", margin: "0 0 8px" },
  copy: { color: "#5c5f62", margin: "0" },
  planBadge: { display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "6px 12px", borderRadius: "20px", background: "#f1f1f1", fontSize: "13px" },
  upgradeLink: { background: "none", border: "none", color: "#008060", fontWeight: 600, cursor: "pointer", fontSize: "13px", padding: 0 },
  successBanner: { background: "#eafaf3", border: "1px solid #9de0c5", borderRadius: "8px", color: "#005c3f", padding: "12px 16px", marginBottom: "1.5rem" },
  sections: { display: "flex", flexDirection: "column", gap: "24px" },
  section: { background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "24px" },
  sectionTitle: { fontSize: "18px", margin: "0 0 16px", paddingBottom: "12px", borderBottom: "1px solid #e0e0e0" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: 600, marginBottom: "12px" },
  input: { padding: "8px 12px", border: "1px solid #c9cccf", borderRadius: "6px", fontSize: "14px", fontWeight: 400 },
  colorGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e0e0e0" },
  primaryButton: { padding: "10px 20px", border: "none", borderRadius: "6px", background: "#008060", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  secondaryButton: { padding: "10px 20px", border: "1px solid #c9cccf", borderRadius: "6px", background: "#ffffff", fontSize: "14px", cursor: "pointer" },
};
