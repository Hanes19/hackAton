<script lang="ts">
  import NavBar from '$lib/NavBar.svelte'
</script>

<svelte:head>
  <title>Privacy Policy — Budol Map</title>
</svelte:head>

<div class="legal-page">
  <NavBar variant="light" />

  <main class="content">
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: June 2026</p>

    <section>
      <h2>1. Who we are</h2>
      <p>
        Budol Map (“we”, “our platform”) connects local buyers with verified sellers in Bukidnon,
        Philippines. This policy explains how we collect, use, and protect your information.
      </p>
    </section>

    <section>
      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Account data</strong> — name, email, and authentication details when you register.</li>
        <li><strong>Order data</strong> — items, delivery method, contact number, address, and payment choice.</li>
        <li><strong>Seller verification</strong> — LGU permit details and ID information submitted during seller registration.</li>
        <li><strong>Location data</strong> — only when you place an order and agree to live tracking (see Section 4).</li>
        <li><strong>Reviews</strong> — ratings and comments you submit after completed orders.</li>
      </ul>
    </section>

    <section>
      <h2>3. How we use your information</h2>
      <p>We use collected data to:</p>
      <ul>
        <li>Process and fulfill orders between buyers and local sellers.</li>
        <li>Display shops on the map and provide directions.</li>
        <li>Verify sellers through LGU permit checks.</li>
        <li>Prevent fraud, fake bookings, and abuse of the platform.</li>
        <li>Improve Budol Map and respond to support requests.</li>
      </ul>
    </section>

    <section>
      <h2>4. Order location tracking</h2>
      <p>
        When you place an order, you must agree to our location tracking terms. Tracking is
        <strong>order-scoped</strong> — it is not continuous background tracking outside an active order.
      </p>

      <h3>Delivery orders</h3>
      <p>
        When your order is marked <em>out for delivery</em>, the <strong>driver or seller</strong> shares
        their live GPS location so you can see progress on the map. Your device is not tracked during
        delivery unless you separately enable map navigation.
      </p>

      <h3>Pickup orders</h3>
      <p>
        When your pickup order is <strong>confirmed</strong>, <strong>you</strong> share your live location
        while heading to the shop. This lets the seller know you are on the way and helps verify genuine
        pickup visits.
      </p>

      <h3>What we store</h3>
      <ul>
        <li>Latest tracker coordinates and timestamp while tracking is active.</li>
        <li>Timestamp of your tracking consent at checkout.</li>
        <li>Tracking stops automatically when the order is completed or cancelled.</li>
      </ul>

      <h3>Who can see tracking</h3>
      <ul>
        <li>Buyers see driver location during delivery.</li>
        <li>Sellers see customer location during confirmed pickup.</li>
        <li>We do not sell location data to third parties.</li>
      </ul>
    </section>

    <section>
      <h2>5. Data retention</h2>
      <p>
        Order records are kept for dispute resolution and platform integrity. Live tracker coordinates are
        cleared when tracking ends. You may request account deletion by contacting support.
      </p>
    </section>

    <section>
      <h2>6. Your choices</h2>
      <ul>
        <li>You can deny location permission in your browser — pickup/delivery tracking will not work for that order.</li>
        <li>You must accept tracking terms to checkout; declining means you cannot place orders through Budol Map.</li>
        <li>You can stop sharing location anytime via the “Stop sharing” control on the tracking screen.</li>
      </ul>
    </section>

    <section>
      <h2>7. Contact</h2>
      <p>
        Questions about this policy? Reach out through the Budol Map assistant or your seller dashboard
        support channel.
      </p>
    </section>

    <p class="footer-links">
      See also: <a href="/terms">Terms & Rules</a> · <a href="/">Home</a>
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

  h3 {
    font-size: 0.95rem;
    margin: 16px 0 8px;
  }

  p, ul {
    margin: 0 0 12px;
    font-size: 15px;
    color: var(--text-muted);
  }

  ul {
    padding-left: 20px;
  }

  strong { color: var(--text-dark); }

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
