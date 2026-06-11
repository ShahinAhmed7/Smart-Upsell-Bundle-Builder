import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate, PRO_PLAN_NAME } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch products for picker
  const response = await admin.graphql(
    `#graphql
      query GetProducts {
        products(first: 50) {
          edges {
            node {
              id
              title
              featuredImage { url }
              priceRangeV2 { minVariantPrice { amount currencyCode } }
              variants(first: 1) { edges { node { id } } }
            }
          }
        }
      }
    `,
  );
  const payload = await response.json();
  const products = payload.data?.products?.edges?.map((e) => e.node) || [];

  // Check plan
  const shopResponse = await admin.graphql(
    `#graphql
      query ShopBillingPlan {
        shop { plan { partnerDevelopment } }
      }
    `,
  );
  const shopPayload = await shopResponse.json();
  const isPartner = shopPayload.data?.shop?.plan?.partnerDevelopment === true;

  const billingCheck = await admin.graphql(
    `#graphql
      query ActiveAppSubscriptions {
        currentAppInstallation {
          activeSubscriptions { name status }
        }
      }
    `,
  );
  const billingPayload = await billingCheck.json();
  const hasProPlan = billingPayload.data?.currentAppInstallation?.activeSubscriptions?.some(
    (s) => s.name === PRO_PLAN_NAME && s.status === "ACTIVE",
  );

  // Count existing bundles
  const bundleCount = await prisma.bundle.count({ where: { shop: session.shop } });

  return {
    products,
    hasProPlan: Boolean(hasProPlan || isPartner),
    atLimit: bundleCount >= 3 && !hasProPlan && !isPartner,
    freeBundleLimit: 3,
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const name = formData.get("name");
  const type = formData.get("type") || "fixed";
  const description = formData.get("description") || "";
  const productsJson = formData.get("products") || "[]";
  const discountType = formData.get("discountType") || "percentage";
  const discountValue = parseFloat(formData.get("discountValue")) || 0;
  const minItems = parseInt(formData.get("minItems"), 10) || 2;
  const maxItems = parseInt(formData.get("maxItems"), 10) || 5;
  const tiersJson = formData.get("tiers") || "[]";

  await prisma.bundle.create({
    data: {
      shop: session.shop,
      name,
      description,
      type,
      products: productsJson,
      discountType,
      discountValue,
      minItems,
      maxItems,
      tiers: tiersJson,
      status: "active",
    },
  });

  return { success: true };
}

export default function NewBundle() {
  const { products, hasProPlan, atLimit, freeBundleLimit } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "fixed",
    selectedProducts: [],
    discountType: "percentage",
    discountValue: 10,
    minItems: 2,
    maxItems: 5,
    tiers: [
      { minItems: 2, price: 0, discount: 5 },
      { minItems: 3, price: 0, discount: 10 },
      { minItems: 5, price: 0, discount: 15 },
    ],
  });

  function toggleProduct(productId) {
    setForm((prev) => {
      const isSelected = prev.selectedProducts.includes(productId);
      return {
        ...prev,
        selectedProducts: isSelected
          ? prev.selectedProducts.filter((id) => id !== productId)
          : [...prev.selectedProducts, productId],
      };
    });
  }

  function updateTier(index, field, value) {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    if (form.type === "fixed" && form.selectedProducts.length < 2) {
      alert("Please select at least 2 products for a fixed bundle.");
      setSaving(false);
      return;
    }

    if (form.type === "custom" && form.tiers.length === 0) {
      alert("Please add at least one pricing tier.");
      setSaving(false);
      return;
    }

    const body = new FormData();
    body.set("name", form.name);
    body.set("description", form.description);
    body.set("type", form.type);
    body.set("products", JSON.stringify(form.selectedProducts));
    body.set("discountType", form.discountType);
    body.set("discountValue", form.discountValue);
    body.set("minItems", form.minItems);
    body.set("maxItems", form.maxItems);
    body.set("tiers", JSON.stringify(form.tiers));

    try {
      await shopify.ready;
      const token = await shopify.idToken();
      const response = await fetch("/app/bundles/new", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (response.ok) {
        navigate("/app/bundles");
      }
    } catch (err) {
      console.error("Failed to create bundle", err);
    } finally {
      setSaving(false);
    }
  }

  if (atLimit) {
    return (
      <main style={styles.page}>
        <div style={styles.warningBanner}>
          <h2 style={styles.warningTitle}>Free plan limit reached</h2>
          <p style={styles.warningCopy}>
            You've created {freeBundleLimit} bundles. Upgrade to Pro for
            unlimited bundles and advanced features.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/billing")}
            style={styles.primaryButton}
          >
            Upgrade to Pro
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Create bundle</h1>
          <p style={styles.copy}>Set up a fixed bundle or "Build Your Own Box" offer.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/bundles")}
          style={styles.secondaryButton}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSave} style={styles.form}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Bundle details</h2>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Bundle name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                placeholder="e.g., Summer Skincare Set"
                required
              />
            </label>
            <label style={styles.label}>
              Description (optional)
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={styles.textarea}
                placeholder="Tell customers what's included..."
                rows={3}
              />
            </label>
            <label style={styles.label}>
              Bundle type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={styles.select}
              >
                <option value="fixed">Fixed bundle (pre-selected products)</option>
                <option value="custom">Build your own (customer picks)</option>
              </select>
            </label>
          </div>
        </section>

        {form.type === "fixed" ? (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Select products</h2>
            <p style={styles.copy}>
              Choose 2+ products to include in this bundle.
              Selected: {form.selectedProducts.length}
            </p>
            <div style={styles.productGrid}>
              {products.map((product) => {
                const isSelected = form.selectedProducts.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    style={{
                      ...styles.productCard,
                      borderColor: isSelected ? "#008060" : "#e1e3e5",
                      background: isSelected ? "#f0f9f4" : "#ffffff",
                    }}
                  >
                    {product.featuredImage && (
                      <img
                        src={product.featuredImage.url}
                        alt=""
                        style={styles.productImage}
                      />
                    )}
                    <div style={styles.productInfo}>
                      <strong style={styles.productTitle}>{product.title}</strong>
                      {product.priceRangeV2 && (
                        <span style={styles.productPrice}>
                          ${parseFloat(product.priceRangeV2.minVariantPrice.amount).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {isSelected && <span style={styles.selectedBadge}>✓</span>}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Pricing tiers</h2>
            <p style={styles.copy}>
              Set up tiered pricing: "Buy 2 get 5% off, Buy 3 get 10% off, etc."
            </p>
            {form.tiers.map((tier, index) => (
              <div key={index} style={styles.tierRow}>
                <span style={styles.tierLabel}>Buy</span>
                <input
                  type="number"
                  min="2"
                  value={tier.minItems}
                  onChange={(e) => updateTier(index, "minItems", parseInt(e.target.value, 10))}
                  style={styles.tierInput}
                />
                <span style={styles.tierLabel}>get</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tier.discount}
                  onChange={(e) => updateTier(index, "discount", parseInt(e.target.value, 10))}
                  style={styles.tierInput}
                />
                <span style={styles.tierLabel}>% off</span>
              </div>
            ))}
          </section>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Discount</h2>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Discount type
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                style={styles.select}
              >
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </label>
            <label style={styles.label}>
              Discount value
              <input
                type="number"
                min="0"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })}
                style={styles.input}
              />
            </label>
          </div>
        </section>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate("/app/bundles")}
            style={styles.secondaryButton}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {saving ? "Creating..." : "Create bundle"}
          </button>
        </div>
      </form>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  heading: {
    fontSize: "28px",
    margin: "0 0 8px",
  },
  copy: {
    color: "#5c5f62",
    margin: "0 0 8px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e1e3e5",
    borderRadius: "8px",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    margin: "0 0 16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e1e3e5",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#202223",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #c9cccf",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 400,
  },
  textarea: {
    padding: "8px 12px",
    border: "1px solid #c9cccf",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 400,
    fontFamily: "inherit",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #c9cccf",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 400,
    background: "#ffffff",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  productCard: {
    position: "relative",
    padding: "12px",
    border: "2px solid #e1e3e5",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#ffffff",
    transition: "all 0.15s ease",
  },
  productImage: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "8px",
  },
  productInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productTitle: {
    fontSize: "14px",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  productPrice: {
    fontSize: "14px",
    color: "#5c5f62",
    fontWeight: 500,
  },
  selectedBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    background: "#008060",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 800,
  },
  tierRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  tierLabel: {
    fontSize: "14px",
    fontWeight: 500,
  },
  tierInput: {
    width: "60px",
    padding: "6px 10px",
    border: "1px solid #c9cccf",
    borderRadius: "6px",
    fontSize: "14px",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  primaryButton: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    background: "#008060",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 20px",
    border: "1px solid #c9cccf",
    borderRadius: "6px",
    background: "#ffffff",
    fontSize: "14px",
    cursor: "pointer",
  },
  warningBanner: {
    textAlign: "center",
    padding: "40px 20px",
    background: "#fff4e5",
    border: "1px solid #ffcf8b",
    borderRadius: "8px",
  },
  warningTitle: {
    fontSize: "20px",
    margin: "0 0 8px",
    color: "#7c4a00",
  },
  warningCopy: {
    color: "#7c4a00",
    margin: "0 0 20px",
  },
};
