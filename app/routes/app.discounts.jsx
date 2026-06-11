import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const discounts = await prisma.volumeDiscount.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return {
    discounts: discounts.map((d) => ({
      ...d,
      productIds: JSON.parse(d.productIds || "[]"),
      collectionIds: JSON.parse(d.collectionIds || "[]"),
      tiers: JSON.parse(d.tiers || "[]"),
    })),
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await prisma.volumeDiscount.delete({ where: { id: formData.get("id") } });
    return { success: true };
  }

  if (intent === "toggle") {
    const discount = await prisma.volumeDiscount.findUnique({ where: { id: formData.get("id") } });
    await prisma.volumeDiscount.update({
      where: { id: formData.get("id") },
      data: { status: discount.status === "active" ? "draft" : "active" },
    });
    return { success: true };
  }

  return null;
}

export default function DiscountsPage() {
  const { discounts } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  async function handleAction(intent, id) {
    await shopify.ready;
    const token = await shopify.idToken();
    const body = new FormData();
    body.set("intent", intent);
    body.set("id", id);
    await fetch("/app/discounts", {
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
          <h1 style={styles.heading}>Volume Discounts</h1>
          <p style={styles.copy}>
            Motivate larger orders with quantity-based discount tiers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/discounts/new")}
          style={styles.primaryButton}
        >
          Create discount
        </button>
      </div>

      {discounts.length === 0 ? (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>No discounts yet</h2>
          <p style={styles.emptyCopy}>
            Create your first volume discount to encourage larger orders.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/discounts/new")}
            style={styles.primaryButton}
          >
            Create your first discount
          </button>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Tiers</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id} style={styles.tr}>
                  <td style={styles.td}><strong>{discount.name}</strong></td>
                  <td style={styles.td}>{discount.tiers.length} tiers</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: discount.status === "active" ? "#e3f1df" : "#f1f1f1",
                        color: discount.status === "active" ? "#005c3f" : "#5c5f62",
                      }}
                    >
                      {discount.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => handleAction("toggle", discount.id)}
                        style={styles.linkButton}
                      >
                        {discount.status === "active" ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction("delete", discount.id)}
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
  page: { maxWidth: "1100px", margin: "0 auto", padding: "2rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  heading: { fontSize: "28px", margin: "0 0 8px" },
  copy: { color: "#5c5f62", margin: "0" },
  primaryButton: { padding: "10px 20px", background: "#008060", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#ffffff", border: "1px dashed #c9cccf", borderRadius: "8px" },
  emptyTitle: { fontSize: "20px", margin: "0 0 8px" },
  emptyCopy: { color: "#5c5f62", margin: "0 0 20px" },
  tableWrapper: { background: "#ffffff", border: "1px solid #e1e3e5", borderRadius: "8px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", background: "#f6f6f7", borderBottom: "1px solid #e1e3e5", fontSize: "13px", fontWeight: 600, color: "#5c5f62" },
  tr: { borderBottom: "1px solid #e1e3e5" },
  td: { padding: "12px 16px", fontSize: "14px" },
  badge: { display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize" },
  actions: { display: "flex", gap: "12px" },
  linkButton: { background: "none", border: "none", color: "#008060", fontSize: "14px", fontWeight: 500, cursor: "pointer", padding: 0 },
  dangerButton: { background: "none", border: "none", color: "#8a0000", fontSize: "14px", fontWeight: 500, cursor: "pointer", padding: 0 },
};
