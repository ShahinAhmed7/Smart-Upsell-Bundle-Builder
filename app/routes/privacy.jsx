export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#f6f6f7", padding: "40px 20px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#202223" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", background: "#ffffff", padding: "48px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: "32px", margin: "0 0 8px" }}>Privacy Policy</h1>
        <p style={{ color: "#6d7175", fontSize: "14px", margin: "0 0 32px" }}>Last updated: June 7, 2026</p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>1. Introduction</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4a4a4a", margin: 0 }}>
            Smart Upsell & Bundle Builder ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you install or use our application in connection with your Shopify store.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>2. Information We Collect</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4a4a4a", margin: "0 0 12px" }}>We collect the minimum information necessary to provide our services:</p>
          <ul style={{ fontSize: "15px", lineHeight: 1.7, color: "#4a4a4a", paddingLeft: "20px" }}>
            <li><strong>Shop Information:</strong> Your Shopify store domain and basic shop details.</li>
            <li><strong>App Settings:</strong> Bundle configurations, discount tiers, and display preferences you set within the app.</li>
            <li><strong>Billing Information:</strong> Subscription status handled exclusively through Shopify's billing API.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, and basic request data for diagnostics.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>3. How We Use Your Information</h2>
          <ul style={{ fontSize: "15px", lineHeight: 1.7, color: "#4a4a4a", paddingLeft: "20px" }}>
            <li>Provide, operate, and maintain the App</li>
            <li>Process your subscription and manage your account</li>
            <li>Save and sync your app settings to your storefront</li>
            <li>Respond to support requests and troubleshoot issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>4. Data Storage and Security</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4a4a4a", margin: 0 }}>
            Your data is stored in secure databases using industry-standard encryption. We use Prisma ORM with SQLite/PostgreSQL databases hosted on Railway. Access to data is restricted to authorized personnel only.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>5. Third-Party Services</h2>
          <ul style={{ fontSize: "15px", lineHeight: 1.7, color: "#4a4a4a", paddingLeft: "20px" }}>
            <li><strong>Shopify:</strong> Authentication, data access, and billing through Shopify's APIs.</li>
            <li><strong>Railway:</strong> Application hosting and database storage.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>6. Your Rights</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4a4a4a", margin: "0 0 12px" }}>You have the right to:</p>
          <ul style={{ fontSize: "15px", lineHeight: 1.7, color: "#4a4a4a", paddingLeft: "20px" }}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to processing or request data portability</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 12px" }}>7. Contact Us</h2>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#4a4a4a", margin: 0 }}>
            If you have questions about this Privacy Policy, please contact us at:<br />
            <a href="mailto:support@smart-upsell-bundle-builder.com" style={{ color: "#008060", textDecoration: "none" }}>support@smart-upsell-bundle-builder.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
