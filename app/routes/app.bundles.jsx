import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const bundles = await prisma.bundle.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return {
    bundles: bundles.map((b) => ({
      ...b,
      products: JSON.parse(b.products || "[]"),
      tiers: JSON.parse(b.tiers || "[]"),
    })),
    freeBundleLimit: 3,
    shop: session.shop,
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const id = formData.get("id");
    await prisma.bundle.delete({ where: { id } });
    return { success: true };
  }

  if (intent === "toggle") {
    const id = formData.get("id");
    const bundle = await prisma.bundle.findUnique({ where: { id } });
    await prisma.bundle.update({
      where: { id },
      data: { status: bundle.status === "active" ? "draft" : "active" },
    });
    return { success: true };
  }

  return null;
}

export default function BundlesPage() {
  const { bundles, freeBundleLimit } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBundles = bundles.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const atLimit = bundles.length >= freeBundleLimit;

  async function handleAction(intent, id) {
    await shopify.ready;
    const token = await shopify.idToken();
    const body = new FormData();
    body.set("intent", intent);
    if (id) body.set("id", id);

    await fetch("/app/bundles", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    window.location.reload();
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Bundles</h1>
          <p style={styles.copy}>
            Create product bundles and "Build Your Own Box" offers to increase
            average order value.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (atLimit) {
              navigate("/app/billing");
            } else {
              navigate("/app/bundles/new");
            }
          }}
          style={styles.primaryButton}
        >
          {atLimit ? "Upgrade for unlimited" : "Create bundle"}
        </button>
      </div>

      {atLimit && (
        <div style={styles.warningBanner}>
          You've reached the Free plan limit of {freeBundleLimit} bundles.
          <a href="/app/billing" style={styles.warningLink}> Upgrade to Pro </a>
          for unlimited bundles.
        </div>
      )}

      <div style={styles.toolbar}>
        <input
          type="search"
          placeholder="Search bundles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.count}>{filteredBundles.length} bundle{filteredBundles.length !== 1 ? "s" : ""}</span>
      </div>

      {filteredBundles.length === 0 ? (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>No bundles yet</h2>
          <p style={styles.emptyCopy}>Create your first bundle to get started.</p>
          <button
            type="button"
            onClick={() => navigate("/app/bundles/new")}
            style={styles.primaryButton}
          >
            Create your first bundle
          </button>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Discount</th>
                <th style={styles.th}>Products</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBundles.map((bundle) => (
                <tr key={bundle.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{bundle.name}</strong>
                  </td>
                  <td style={styles.td}>
                    {bundle.type === "fixed" ? "Fixed bundle" : "Build your own"}
                  </td>
                  <td style={styles.td}>
                    {bundle.discountValue > 0
                      ? `${bundle.discountValue}${bundle.discountType === "percentage" ? "%" : " off"}`
                      : "—"}
                  </td>
                  <td style={styles.td}>{bundle.products.length}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: bundle.status === "active" ? "#e3f1df" : "#f1f1f1",
                        color: bundle.status === "active" ? "#005c3f" : "#5c5f62",
                      }}
                    >
                      {bundle.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => handleAction("toggle", bundle.id)}
                        style={styles.linkButton}
                      >
                        {bundle.status === "active" ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction("delete", bundle.id)}
                        style={styles.dangerButton}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
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
    gap: "1rem",
  },
  heading: {
    fontSize: "28px",
    margin: "0 0 8px",
  },
  copy: {
    color: "#5c5f62",
    margin: "0",
  },
  primaryButton: {
    padding: "10px 20px",
    background: "#008060",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  warningBanner: {
    background: "#fff4e5",
    border: "1px solid #ffcf8b",
    borderRadius: "8px",
    color: "#7c4a00",
    padding: "12px 16px",
    marginBottom: "1.5rem",
  },
  warningLink: {
    color: "#008060",
    fontWeight: 600,
    textDecoration: "underline",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  searchInput: {
    flex: 1,
    maxWidth: "400px",
    padding: "8px 12px",
    border: "1px solid #c9cccf",
    borderRadius: "6px",
    fontSize: "14px",
  },
  count: {
    color: "#6d7175",
    fontSize: "14px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#ffffff",
    border: "1px dashed #c9cccf",
    borderRadius: "8px",
  },
  emptyTitle: {
    fontSize: "20px",
    margin: "0 0 8px",
  },
  emptyCopy: {
    color: "#5c5f62",
    margin: "0 0 20px",
  },
  tableWrapper: {
    background: "#ffffff",
    border: "1px solid #e1e3e5",
    borderRadius: "8px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f6f6f7",
    borderBottom: "1px solid #e1e3e5",
    fontSize: "13px",
    fontWeight: 600,
    color: "#5c5f62",
  },
  tr: {
    borderBottom: "1px solid #e1e3e5",
  },
  td: {
    padding: "12px 16px",
    fontSize: "14px",
  },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#008060",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
  },
  dangerButton: {
    background: "none",
    border: "none",
    color: "#8a0000",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
  },
};
