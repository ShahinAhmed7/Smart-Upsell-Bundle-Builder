import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Link } from "react-router";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Smart Upsell & Bundle Builder</p>
          <h1 style={styles.heading}>Increase average order value with smart bundles</h1>
          <p style={styles.copy}>
            Boost revenue with Frequently Bought Together, Build Your Own Bundle,
            and Volume Discount widgets — all managed from the app backend.
          </p>
        </div>
        <div style={styles.statusCard}>
          <span style={styles.statusDot} />
          <div>
            <strong>Theme app embed ready</strong>
            <p style={styles.muted}>Enable Smart Upsell in your theme settings.</p>
          </div>
        </div>
      </section>

      <section style={styles.grid}>
        <article style={styles.card}>
          <p style={styles.cardLabel}>Conversion</p>
          <h2 style={styles.cardTitle}>Frequently Bought Together</h2>
          <p style={styles.cardCopy}>
            Show related products customers often buy together, increasing
            average order value by 10–30%.
          </p>
        </article>
        <article style={styles.card}>
          <p style={styles.cardLabel}>Bundles</p>
          <h2 style={styles.cardTitle}>Build Your Own Box</h2>
          <p style={styles.cardCopy}>
            Let customers create custom bundles like "Pick 3 for $50" with
            tiered pricing and discounts.
          </p>
        </article>
        <article style={styles.card}>
          <p style={styles.cardLabel}>Discounts</p>
          <h2 style={styles.cardTitle}>Volume Discount Tiers</h2>
          <p style={styles.cardCopy}>
            Motivate larger orders with quantity-based discounts and progress
            bars on product pages.
          </p>
        </article>
      </section>

      <section style={styles.panel}>
        <div>
          <p style={styles.cardLabel}>Current setup</p>
          <h2 style={styles.panelTitle}>Quick start</h2>
        </div>
        <div style={styles.checkGrid}>
          <div style={styles.checkItem}>
            <span style={styles.checkMark}>✓</span>
            <span>Create your first bundle</span>
          </div>
          <div style={styles.checkItem}>
            <span style={styles.checkMark}>✓</span>
            <span>Set up volume discount tiers</span>
          </div>
          <div style={styles.checkItem}>
            <span style={styles.checkMark}>✓</span>
            <span>Enable Theme App Embed</span>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "56px 24px 80px",
    color: "#202223",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: "24px",
    alignItems: "stretch",
    marginBottom: "24px",
  },
  kicker: {
    margin: "0 0 10px",
    color: "#008060",
    fontSize: "14px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  heading: {
    margin: 0,
    maxWidth: "720px",
    fontSize: "36px",
    lineHeight: 1.15,
  },
  copy: {
    maxWidth: "680px",
    margin: "16px 0 0",
    color: "#5c5f62",
    fontSize: "17px",
    lineHeight: 1.55,
  },
  statusCard: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    padding: "22px",
    border: "1px solid #dfe3e8",
    borderRadius: "8px",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    background: "#008060",
    boxShadow: "0 0 0 5px #e3f1df",
    flex: "0 0 auto",
  },
  muted: {
    margin: "6px 0 0",
    color: "#6d7175",
    lineHeight: 1.45,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  card: {
    minHeight: "190px",
    padding: "22px",
    border: "1px solid #dfe3e8",
    borderRadius: "8px",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  cardLabel: {
    margin: "0 0 10px",
    color: "#008060",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  cardTitle: {
    margin: 0,
    fontSize: "21px",
    lineHeight: 1.25,
  },
  cardCopy: {
    margin: "12px 0 0",
    color: "#5c5f62",
    fontSize: "15px",
    lineHeight: 1.55,
  },
  panel: {
    padding: "24px",
    border: "1px solid #dfe3e8",
    borderRadius: "8px",
    background: "#f6f6f7",
  },
  panelTitle: {
    margin: 0,
    fontSize: "24px",
  },
  checkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },
  checkItem: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    padding: "12px",
    borderRadius: "6px",
    background: "#ffffff",
    border: "1px solid #e1e3e5",
    fontWeight: 600,
  },
  checkMark: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    background: "#e3f1df",
    color: "#008060",
    fontWeight: 800,
  },
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
