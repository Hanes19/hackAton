<script lang="ts">
  import NavBar from '$lib/NavBar.svelte'
</script>

<svelte:head>
  <title>Terms & Rules — Budol Map</title>
</svelte:head>

<div class="legal-page">
  <NavBar variant="light" />

  <main class="content">
    <h1>Terms, Rules & Regulations</h1>
    <p class="updated">Last updated: June 2026</p>

    <section>
      <h2>1. Acceptance</h2>
      <p>
        By using Budol Map, registering a shop, or placing an order, you agree to these terms and our
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </section>

    <section>
      <h2>2. Platform rules</h2>
      <ul>
        <li>Sellers must provide accurate business information and valid LGU permits where required.</li>
        <li>Listings must truthfully describe products or services, prices, and availability.</li>
        <li>Buyers must provide a valid contact number and correct delivery or pickup details.</li>
        <li>Harassment, discrimination, illegal goods, and misleading listings are prohibited.</li>
        <li>Budol Map may suspend accounts that violate these rules or receive repeated complaints.</li>
      </ul>
    </section>

    <section>
      <h2>3. Orders & fulfillment</h2>
      <ul>
        <li>Orders are agreements between buyer and seller; Budol Map facilitates discovery and checkout.</li>
        <li>Sellers should confirm orders promptly and update status (confirmed → shipped/delivery or pickup ready → completed).</li>
        <li>Payment terms follow the method selected at checkout (COD, GCash, Maya, or card in demo mode).</li>
        <li>Cancellations should be communicated promptly; repeated no-shows may lead to account restrictions.</li>
      </ul>
    </section>

    <section>
      <h2>4. Live tracking requirements</h2>
      <p>All checkout orders require consent to order-scoped location tracking:</p>
      <ul>
        <li><strong>Delivery</strong> — the driver/seller shares location while the order is out for delivery.</li>
        <li><strong>Pickup</strong> — the customer shares location after the order is confirmed and while en route to the shop.</li>
      </ul>
      <p>
        Refusing to share location when required may delay fulfillment. Tampering with or spoofing GPS data
        is a violation of these terms.
      </p>
    </section>

    <section>
      <h2>5. Anti–fake booking policy</h2>
      <p>To protect local sellers from fraudulent or prank orders, Budol Map may:</p>
      <ul>
        <li>Require verified phone numbers and tracking consent before checkout.</li>
        <li>Use live location during pickup to confirm a buyer is genuinely heading to the shop.</li>
        <li>Flag accounts that repeatedly place orders without completing pickup or delivery.</li>
        <li>Share order evidence (contact info, tracking logs, timestamps) with sellers for dispute resolution.</li>
        <li>Restrict or ban buyers who abuse COD, fake addresses, or no-show patterns.</li>
      </ul>
      <p>
        Sellers should not fulfill orders that show suspicious patterns (invalid numbers, no tracking movement
        on confirmed pickup, etc.) and may cancel such orders through the dashboard.
      </p>
    </section>

    <section>
      <h2>6. Reviews</h2>
      <p>
        Reviews must be honest and related to a completed or fulfilled order. Fake reviews, retaliation, or
        incentivized ratings are not allowed.
      </p>
    </section>

    <section>
      <h2>7. Limitation of liability</h2>
      <p>
        Budol Map is provided as-is for local marketplace discovery. We are not responsible for product
        quality, delivery delays, or disputes between buyers and sellers, though we encourage good-faith
        resolution and may assist with platform abuse cases.
      </p>
    </section>

    <section>
      <h2>8. Changes</h2>
      <p>
        We may update these terms. Continued use after changes constitutes acceptance. Material changes to
        tracking or checkout rules will be reflected on this page.
      </p>
    </section>

    <p class="footer-links">
      See also: <a href="/privacy">Privacy Policy</a> · <a href="/">Home</a>
    </p>
  </main>
</div>

<style>
  .legal-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-sans);
  }

  .content {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 20px 64px;
    color: var(--text-dark);
    line-height: 1.65;
  }

  h1 {
    margin: 0 0 6px;
    font-size: 1.75rem;
  }

  .updated {
    margin: 0 0 28px;
    font-size: 13px;
    color: var(--text-muted);
  }

  section {
    margin-bottom: 28px;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 10px;
  }

  p, ul {
    margin: 0 0 12px;
    font-size: 15px;
    color: var(--text-muted);
  }

  ul {
    padding-left: 20px;
  }

  .footer-links {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 14px;
  }

  a {
    color: var(--budol-orange);
  }
</style>
