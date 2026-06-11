import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return null;
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    name: formData.get("name"),
    title: formData.get("title") || "Volume Discount",
    message: formData.get("message") || "Buy {quantity} items, get {discount}% off!",
    tiers: JSON.stringify([
      { quantity: parseInt(formData.get("tier1Qty"), 10), discount: parseInt(formData.get("tier1Discount"), 10) },
      { quantity: parseInt(formData.get("tier2Qty"), 10), discount: parseInt(formData.get("tier2Discount"), 10) },
      { quantity: parseInt(formData.get("tier3Qty"), 10), discount: parseInt(formData.get("tier3Discount"), 10) },
    ]),
    productIds: "[]",
    collectionIds: "[]",
    showProgressBar: true,
    showBadge: true,
    status: "active",
  };

  await prisma.volumeDiscount.create({ data: { shop: session.shop, ...data } });
  return { success: true };
}

export default function NewDiscount() {
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "Volume Discount",
    message: "Buy {quantity} items, get {discount}% off!",
    tier1Qty: 2, tier1Discount: 5,
    tier2Qty: 3, tier2Discount: 10,
    tier3Qty: 5, tier3Discount: 15,
  });

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.set(k, v));
    try {
      await shopify.ready;
      const token = await shopify.idToken();
      const response = await fetch("/app/discounts/new", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (response.ok) navigate("/app/discounts");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.heading}>Create Volume Discount</h1>
      <form onSubmit={handleSave} style={styles.form}>
        <section style={styles.section}>
          <label style={styles.label}>
            Discount name
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} required />
          </label>
          <label style={styles.label}>
            Display title
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} />
          </label>
        </section>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Discount Tiers</h2>
          {[
            { qty: "tier1Qty", disc: "tier1Discount" },
            { qty: "tier2Qty", disc: "tier2Discount" },
            { qty: "tier3Qty", disc: "tier3Discount" },
          ].map((tier, i) => (
            <div key={i} style={styles.tierRow}>
              <span>Buy</span>
              <input type="number" min="2" value={form[tier.qty]} onChange={(e) => setForm({ ...form, [tier.qty]: parseInt(e.target.value, 10) })} style={styles.tierInput} />
              <span>get</span>
              <input type="number" min="0" max="100" value={form[tier.disc]} onChange={(e) => setForm({ ...form, [tier.disc]: parseInt(e.target.value, 10) })} style={styles.tierInput} />
              <span>% off</span>
            </div>
          ))}
        </section>
        <div style={styles.actions}>
          <button type="button" onClick={() => navigate("/app/discounts")} style={styles.secondaryButton}>Cancel</button>
          <button type="submit" disabled={saving} style={styles.primaryButton}>{saving ? "Creating..." : "Create discount"}</button>
        </div>
      </form>
    </main>
  );
}

const styles = {
  page: { maxWidth: "700px", margin: "0 auto", padding: "2rem", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" },
  heading: { fontSize: "28px", margin: "0 0 24px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  section: { background: "#ffffff", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" },
  sectionTitle: { fontSize: "18px", margin: "0 0 12px" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: 600 },
  input: { padding: "8px 12px", border: "1px solid #c9cccf", borderRadius: "6px", fontSize: "14px", fontWeight: 400 },
  tierRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
  tierInput: { width: "60px", padding: "6px 10px", border: "1px solid #c9cccf", borderRadius: "6px", fontSize: "14px", textAlign: "center" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "12px" },
  primaryButton: { padding: "10px 20px", border: "none", borderRadius: "6px", background: "#008060", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  secondaryButton: { padding: "10px 20px", border: "1px solid #c9cccf", borderRadius: "6px", background: "#ffffff", fontSize: "14px", cursor: "pointer" },
};
