<script lang="ts">
  import { goto } from '$app/navigation'
  import NavBar from '$lib/NavBar.svelte'

  const stats = [
    { value: '120+', label: 'Local shops' },
    { value: '6', label: 'Categories' },
    { value: '24/7', label: 'Map access' }
  ]

  const steps = [
    {
      num: '01',
      title: 'Explore the map',
      desc: 'Pan across Bukidnon and discover shops pinned right where they operate.'
    },
    {
      num: '02',
      title: 'Find what you need',
      desc: 'Filter by category, search products, and compare local sellers instantly.'
    },
    {
      num: '03',
      title: 'Order or visit',
      desc: 'Place orders from the map panel or get directions straight to the shop.'
    }
  ]

  const features = [
    {
      size: 'large',
      icon: '📍',
      title: 'Live map discovery',
      desc: 'Every verified shop appears on an interactive map — no endless scrolling through listings.',
      tag: 'Core'
    },
    {
      size: 'small',
      icon: '🧭',
      title: 'Built-in directions',
      desc: 'Walking, motorcycle, or car routes from your location.',
      tag: null
    },
    {
      size: 'small',
      icon: '🛒',
      title: 'Order in-app',
      desc: 'Browse menus and place orders without leaving the map.',
      tag: null
    },
    {
      size: 'medium',
      icon: '🤝',
      title: 'Built for local sellers',
      desc: 'Free registration, LGU verification, and a dashboard to manage your listings.',
      tag: 'Sellers'
    },
    {
      size: 'medium',
      icon: '🔍',
      title: 'Smart search',
      desc: 'Search by shop name, product, or category — results sync with the map.',
      tag: null
    }
  ]

  const picks = [
    {
      emoji: '☕',
      name: 'Native Coffee Beans',
      location: 'Manolo Fortich',
      category: 'Food',
      tone: 'sand'
    },
    {
      emoji: '🧶',
      name: 'Handcrafted Weaves',
      location: 'Lantapan',
      category: 'Clothing',
      tone: 'olive'
    },
    {
      emoji: '🍍',
      name: 'Pineapple Products',
      location: 'Manolo Fortich',
      category: 'Food',
      tone: 'blue'
    },
    {
      emoji: '🌿',
      name: 'Organic Produce',
      location: 'Valencia City',
      category: 'Food',
      tone: 'grape'
    }
  ]
</script>

<svelte:head>
  <title>Budol Map — Local marketplace for Bukidnon</title>
</svelte:head>

<div class="landing">
  <header class="top-bar">
    <NavBar variant="light" />
  </header>

  <!-- Hero -->
  <section class="hero" aria-labelledby="hero-heading">
    <div class="hero-mesh" aria-hidden="true">
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
      <div class="orb orb-c"></div>
      <div class="grid-lines"></div>
    </div>

    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">
          <span class="eyebrow-dot"></span>
          Valencia City & Bukidnon
        </p>
        <h1 id="hero-heading">
          Discover local shops.<br />
          <span class="headline-accent">On the map.</span>
        </h1>
        <p class="hero-lead">
          Budol Map connects buyers and small businesses across Bukidnon — search, explore,
          order, and navigate in one place.
        </p>
        <div class="hero-cta">
          <button class="btn btn-main" onclick={() => goto('/map')}>
            Open the map
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <a href="/register" class="btn btn-ghost">List your shop</a>
        </div>
        <dl class="hero-stats">
          {#each stats as stat (stat.label)}
            <div class="stat">
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          {/each}
        </dl>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="visual-glow"></div>
        <div class="preview-card main-preview">
          <div class="preview-toolbar">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="preview-url">budolmap.ph/map</span>
          </div>
          <img src="/app-screenshot.png" alt="" class="preview-img" />
        </div>
        <div class="float-card float-card-a">
          <span class="float-icon">📍</span>
          <div>
            <strong>12 shops nearby</strong>
            <span>Valencia City</span>
          </div>
        </div>
        <div class="float-card float-card-b">
          <span class="float-icon">🛵</span>
          <div>
            <strong>8 min away</strong>
            <span>Motorcycle route</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="section steps-section" aria-labelledby="steps-heading">
    <div class="container">
      <div class="section-head">
        <p class="section-label">How it works</p>
        <h2 id="steps-heading">From map to doorstep in three steps</h2>
      </div>
      <ol class="steps">
        {#each steps as step, i (step.num)}
          <li class="step">
            <span class="step-num">{step.num}</span>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
            {#if i < steps.length - 1}
              <span class="step-connector" aria-hidden="true"></span>
            {/if}
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <!-- Bento features -->
  <section class="section features-section" aria-labelledby="features-heading">
    <div class="container">
      <div class="section-head row">
        <div>
          <p class="section-label">Platform</p>
          <h2 id="features-heading">Everything you need to explore Bukidnon</h2>
        </div>
        <a href="/map" class="text-link">See all shops →</a>
      </div>
      <div class="bento">
        {#each features as f (f.title)}
          <article class="bento-card" class:large={f.size === 'large'} class:medium={f.size === 'medium'}>
            {#if f.tag}
              <span class="bento-tag">{f.tag}</span>
            {/if}
            <span class="bento-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <!-- Featured picks -->
  <section class="section picks-section" aria-labelledby="picks-heading">
    <div class="container">
      <div class="section-head">
        <p class="section-label">Featured</p>
        <h2 id="picks-heading">Popular picks from local sellers</h2>
        <p class="section-sub">Tap any card to jump straight into the map.</p>
      </div>
      <div class="picks-track">
        {#each picks as pick (pick.name)}
          <button type="button" class="pick-card tone-{pick.tone}" onclick={() => goto('/map')}>
            <div class="pick-visual">{pick.emoji}</div>
            <div class="pick-body">
              <span class="pick-cat">{pick.category}</span>
              <h3>{pick.name}</h3>
              <p>{pick.location}</p>
            </div>
            <span class="pick-arrow" aria-hidden="true">→</span>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- Dual CTA -->
  <section class="section cta-section" aria-label="Get started">
    <div class="container cta-grid">
      <article class="cta-card cta-buyer">
        <p class="cta-label">For buyers</p>
        <h2>Find what's around you</h2>
        <p>Browse the interactive map, filter by category, and support businesses in your community.</p>
        <button class="btn btn-main" onclick={() => goto('/map')}>Explore the map</button>
      </article>
      <article class="cta-card cta-seller">
        <p class="cta-label">For sellers</p>
        <h2>Put your shop on the map</h2>
        <p>Register for free, pin your location, list products, and reach buyers across Bukidnon.</p>
        <a href="/register" class="btn btn-seller">Register your shop</a>
      </article>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <img src="/logo.png" alt="" class="footer-logo" />
        <p>Budol Map empowers local trade across Bukidnon — built for the community.</p>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <div class="footer-col">
          <h4>Explore</h4>
          <a href="/map">Map</a>
          <a href="/">Home</a>
        </div>
        <div class="footer-col">
          <h4>Sellers</h4>
          <a href="/register">Register shop</a>
          <a href="/dashboard">Dashboard</a>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <a href="/login">Login</a>
          <a href="/register-user">Sign up</a>
        </div>
      </nav>
    </div>
    <div class="container footer-bottom">
      <span>© {new Date().getFullYear()} Budol Map</span>
      <span>Valencia City · Bukidnon, Philippines</span>
    </div>
  </footer>
</div>

<style>
  .landing {
    --section-pad: clamp(3.5rem, 8vw, 6rem);
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
  }

  .container {
    width: min(1120px, calc(100% - 2.5rem));
    margin-inline: auto;
  }

  .top-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
  }

  /* ── Hero ─────────────────────────────────────────────── */
  .hero {
    position: relative;
    min-height: calc(100vh - 60px);
    min-height: calc(100dvh - 60px);
    display: flex;
    align-items: center;
    padding: clamp(2rem, 5vw, 4rem) 0;
    background: var(--bg);
    overflow: hidden;
  }

  .hero-mesh {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
  }

  .orb-a {
    width: 420px;
    height: 420px;
    background: var(--budol-orange);
    top: -10%;
    left: -8%;
    opacity: 0.18;
  }

  .orb-b {
    width: 360px;
    height: 360px;
    background: var(--pin-blue);
    bottom: 5%;
    right: 10%;
    opacity: 0.12;
  }

  .orb-c {
    width: 280px;
    height: 280px;
    background: var(--map-land);
    top: 40%;
    right: 30%;
    opacity: 0.1;
  }

  .grid-lines {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(202, 207, 133, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(202, 207, 133, 0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%);
  }

  .hero-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: center;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 1.25rem;
    padding: 6px 14px 6px 10px;
    background: var(--primary-light);
    border: 1px solid rgba(255, 87, 34, 0.25);
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--budol-orange);
  }

  .eyebrow-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--budol-orange);
    box-shadow: 0 0 10px rgba(255, 87, 34, 0.5);
    animation: pulse 2.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  .hero-copy h1 {
    margin: 0 0 1.25rem;
    font-size: clamp(2.4rem, 5.5vw, 3.75rem);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: var(--text-dark);
  }

  .headline-accent {
    color: var(--budol-orange);
  }

  .hero-lead {
    margin: 0 0 2rem;
    max-width: 460px;
    font-size: clamp(1rem, 1.8vw, 1.125rem);
    line-height: 1.65;
    color: var(--text-muted);
  }

  .hero-cta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 2.5rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }

  .btn:hover {
    transform: translateY(-2px);
  }

  .btn-main {
    background: var(--gradient-brand);
    color: var(--text-inverse);
    box-shadow: 0 8px 28px rgba(101, 142, 156, 0.35);
  }

  .btn-main:hover {
    box-shadow: 0 12px 36px rgba(140, 186, 128, 0.35);
  }

  .btn-ghost {
    background: var(--bg-card);
    color: var(--text-dark);
    border: 1px solid var(--border-strong);
  }

  .btn-ghost:hover {
    border-color: var(--budol-orange);
    color: var(--budol-orange);
  }

  .hero-stats {
    display: flex;
    gap: clamp(1.5rem, 4vw, 2.5rem);
    margin: 0;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .stat {
    margin: 0;
  }

  .stat dt {
    margin: 0 0 2px;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    color: var(--budol-orange);
    letter-spacing: -0.02em;
  }

  .stat dd {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Hero visual */
  .hero-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 420px;
  }

  .visual-glow {
    position: absolute;
    width: 70%;
    height: 70%;
    background: radial-gradient(circle, rgba(101, 142, 156, 0.35) 0%, transparent 70%);
    border-radius: 50%;
  }

  .preview-card {
    position: relative;
    width: min(100%, 340px);
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transform: perspective(900px) rotateY(-6deg) rotateX(4deg);
    transition: transform 0.4s ease;
  }

  .landing:hover .preview-card,
  .preview-card:hover {
    transform: perspective(900px) rotateY(-2deg) rotateX(2deg);
  }

  .preview-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 14px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot.red { background: #e06c6c; }
  .dot.yellow { background: var(--budol-orange); }
  .dot.green { background: var(--map-land); }

  .preview-url {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-subtle-on-dark);
    font-family: ui-monospace, monospace;
  }

  .preview-img {
    display: block;
    width: 100%;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    object-position: top;
  }

  .float-card {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-md);
    animation: float 5s ease-in-out infinite;
  }

  .float-card strong {
    display: block;
    font-size: 13px;
    color: var(--text-dark);
  }

  .float-card span:not(.float-icon) {
    font-size: 11px;
    color: var(--text-muted);
  }

  .float-icon {
    font-size: 20px;
    line-height: 1;
  }

  .float-card-a {
    top: 8%;
    right: 0;
    animation-delay: 0s;
  }

  .float-card-b {
    bottom: 12%;
    left: -4%;
    animation-delay: 1.2s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  /* ── Sections ─────────────────────────────────────────── */
  .section {
    padding-block: var(--section-pad);
  }

  .section-head {
    margin-bottom: clamp(2rem, 4vw, 3rem);
  }

  .section-head.row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .section-label {
    margin: 0 0 0.5rem;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--primary);
  }

  .section-head h2 {
    margin: 0;
    font-size: clamp(1.6rem, 3.5vw, 2.25rem);
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: var(--text);
  }

  .section-sub {
    margin: 0.5rem 0 0;
    font-size: 15px;
    color: var(--text3);
  }

  .text-link {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.15s;
  }

  .text-link:hover {
    color: var(--accent);
  }

  /* Steps */
  .steps-section {
    background: var(--bg-elevated);
    border-block: 1px solid var(--border);
  }

  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .step {
    position: relative;
    padding: 1.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .step:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
  }

  .step-num {
    display: block;
    margin-bottom: 1rem;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--primary);
    font-family: ui-monospace, monospace;
  }

  .step h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
  }

  .step p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text2);
  }

  .step-connector {
    display: none;
  }

  /* Bento */
  .features-section {
    background: var(--bg);
  }

  .bento {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(160px, auto);
    gap: 1rem;
  }

  .bento-card {
    position: relative;
    padding: 1.5rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    overflow: hidden;
  }

  .bento-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--gradient-brand);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .bento-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  .bento-card:hover::before {
    opacity: 1;
  }

  .bento-card.large {
    grid-column: span 2;
    grid-row: span 2;
    padding: 2rem;
  }

  .bento-card.medium {
    grid-column: span 1;
  }

  .bento-tag {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    background: var(--primary-light);
    color: var(--primary);
    border-radius: var(--radius-pill);
  }

  .bento-icon {
    display: block;
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
  }

  .bento-card.large .bento-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .bento-card h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
  }

  .bento-card.large h3 {
    font-size: 1.35rem;
  }

  .bento-card p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text2);
  }

  .bento-card.large p {
    font-size: 15px;
    max-width: 420px;
  }

  /* Picks */
  .picks-section {
    background: var(--bg-elevated);
    border-top: 1px solid var(--border);
  }

  .picks-track {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .pick-card {
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg);
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }

  .pick-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-strong);
  }

  .pick-visual {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
  }

  .tone-sand .pick-visual { background: linear-gradient(145deg, rgba(202,207,133,0.35), rgba(202,207,133,0.12)); }
  .tone-olive .pick-visual { background: linear-gradient(145deg, rgba(140,186,128,0.35), rgba(140,186,128,0.12)); }
  .tone-blue .pick-visual { background: linear-gradient(145deg, rgba(101,142,156,0.35), rgba(101,142,156,0.12)); }
  .tone-grape .pick-visual { background: linear-gradient(145deg, rgba(77,83,130,0.35), rgba(77,83,130,0.12)); }

  .pick-body {
    padding: 1rem 1rem 1.25rem;
    flex: 1;
  }

  .pick-cat {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--primary);
  }

  .pick-body h3 {
    margin: 4px 0 2px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .pick-body p {
    margin: 0;
    font-size: 12px;
    color: var(--text3);
  }

  .pick-arrow {
    display: block;
    padding: 0 1rem 1rem;
    font-size: 18px;
    color: var(--primary);
    text-align: right;
    transition: transform 0.2s;
  }

  .pick-card:hover .pick-arrow {
    transform: translateX(4px);
  }

  /* CTA */
  .cta-section {
    padding-bottom: var(--section-pad);
  }

  .cta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .cta-card {
    padding: clamp(2rem, 4vw, 2.75rem);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .cta-buyer {
    background: var(--bg-card);
    color: var(--text-dark);
    border-color: var(--border);
  }

  .cta-seller {
    background: var(--primary-light);
    color: var(--text-dark);
    border-color: rgba(255, 87, 34, 0.2);
  }

  .cta-label {
    margin: 0 0 0.75rem;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--budol-orange);
  }

  .cta-card h2 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.35rem, 2.5vw, 1.75rem);
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .cta-card p {
    margin: 0 0 1.5rem;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-muted);
    max-width: 36ch;
  }

  .btn-seller {
    background: var(--budol-orange);
    color: var(--text-inverse);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    padding: 14px 24px;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 700;
    transition: transform 0.18s, opacity 0.18s;
  }

  .btn-seller:hover {
    transform: translateY(-2px);
    opacity: 0.92;
  }

  /* Footer */
  .site-footer {
    background: var(--text-dark);
    color: var(--text-muted-on-dark);
    padding: 3rem 0 1.5rem;
    border-top: 1px solid var(--border);
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.4fr 2fr;
    gap: 3rem;
    padding-bottom: 2.5rem;
    border-bottom: 1px solid rgba(202, 207, 133, 0.1);
  }

  .footer-logo {
    width: 40px;
    height: 40px;
    margin-bottom: 1rem;
  }

  .footer-brand p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    max-width: 280px;
  }

  .footer-nav {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .footer-col h4 {
    margin: 0 0 0.75rem;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--budol-orange);
  }

  .footer-col a {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 14px;
    color: var(--text-subtle-on-dark);
    text-decoration: none;
    transition: color 0.15s;
  }

  .footer-col a:hover {
    color: var(--text-on-dark);
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-top: 1.5rem;
    font-size: 12px;
    color: var(--text-subtle-on-dark);
  }

  /* ── Responsive ───────────────────────────────────────── */
  @media (max-width: 960px) {
    .hero-grid {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .hero-lead {
      margin-inline: auto;
    }

    .hero-cta {
      justify-content: center;
    }

    .hero-stats {
      justify-content: center;
    }

    .hero-visual {
      min-height: 360px;
      margin-top: 1rem;
    }

    .float-card-a { right: 4%; }
    .float-card-b { left: 4%; }

    .steps {
      grid-template-columns: 1fr;
    }

    .bento {
      grid-template-columns: 1fr 1fr;
    }

    .bento-card.large {
      grid-column: span 2;
      grid-row: span 1;
    }

    .picks-track {
      grid-template-columns: repeat(2, 1fr);
    }

    .cta-grid {
      grid-template-columns: 1fr;
    }

    .footer-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .bento {
      grid-template-columns: 1fr;
    }

    .bento-card.large {
      grid-column: span 1;
    }

    .picks-track {
      grid-template-columns: 1fr;
    }

    .preview-card {
      transform: none;
    }

    .footer-nav {
      grid-template-columns: 1fr 1fr;
    }

    .footer-bottom {
      flex-direction: column;
    }
  }
</style>
