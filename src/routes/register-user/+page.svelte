<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { register } from '$lib/auth'
  import { safeRedirect, loginUrl } from '$lib/navigation'
  import NavBar from '$lib/NavBar.svelte'

  let name = $state('')
  let email = $state('')
  let password = $state('')
  let confirm = $state('')
  let loading = $state(false)
  let error = $state('')

  let nextUrl = $derived(safeRedirect($page.url.searchParams.get('next'), '/'))

  const perks = [
    { icon: '📍', title: 'Explore the map', desc: 'Find shops and products pinned across Bukidnon.' },
    { icon: '🛒', title: 'Order locally', desc: 'Browse menus and place orders from nearby sellers.' },
    { icon: '🧭', title: 'Get directions', desc: 'Navigate to shops with walking, bike, or car routes.' }
  ]

  let passwordHint = $derived.by(() => {
    if (!password) return ''
    if (password.length < 6) return 'Use at least 6 characters'
    if (password !== confirm && confirm) return 'Passwords do not match'
    return 'Looks good'
  })

  let passwordHintOk = $derived(password.length >= 6 && (!confirm || password === confirm))

  async function submit(e?: Event) {
    e?.preventDefault()
    if (password !== confirm) {
      error = 'Passwords do not match'
      return
    }
    if (password.length < 6) {
      error = 'Password must be at least 6 characters'
      return
    }
    loading = true
    error = ''
    const { error: err } = await register(email, password, name)
    loading = false
    if (err) error = err.message
    else goto(nextUrl)
  }
</script>

<svelte:head>
  <title>Create account — Budol Map</title>
</svelte:head>

<div class="page">
  <NavBar variant="light" />

  <div class="page-body">
    <aside class="promo" aria-hidden="false">
      <div class="promo-mesh" aria-hidden="true">
        <div class="orb orb-a"></div>
        <div class="orb orb-b"></div>
      </div>

      <div class="promo-inner">
        <p class="eyebrow">
          <span class="eyebrow-dot"></span>
          Free buyer account
        </p>
        <h1>Join Budol Map</h1>
        <p class="promo-lead">
          Create a free account to save favorites, order from local shops, and get directions on the map.
        </p>

        <ul class="perks">
          {#each perks as perk (perk.title)}
            <li>
              <span class="perk-icon">{perk.icon}</span>
              <div>
                <strong>{perk.title}</strong>
                <span>{perk.desc}</span>
              </div>
            </li>
          {/each}
        </ul>

        <p class="seller-note">
          Selling instead? <a href="/register">Register as a seller →</a>
        </p>
      </div>
    </aside>

    <main class="form-panel">
      <div class="card">
        <div class="card-head">
          <div class="brand">
            <div class="brand-icon" aria-hidden="true">🗺</div>
            <span class="brand-name">Budol Map</span>
          </div>
          <h2>Create your account</h2>
          <p class="subheading">Takes less than a minute — no credit card needed.</p>
        </div>

        <form class="fields" onsubmit={submit}>
          <div class="field">
            <label for="name">Full name</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3" />
                <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
              <input
                id="name"
                bind:value={name}
                placeholder="Juan dela Cruz"
                autocomplete="name"
                required
              />
            </div>
          </div>

          <div class="field">
            <label for="email">Email address</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3" />
                <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" stroke-width="1.3" />
              </svg>
              <input
                id="email"
                type="email"
                bind:value={email}
                placeholder="you@email.com"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="password">Password</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3" />
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.3" />
                </svg>
                <input
                  id="password"
                  type="password"
                  bind:value={password}
                  placeholder="••••••••"
                  autocomplete="new-password"
                  required
                  minlength="6"
                />
              </div>
            </div>

            <div class="field">
              <label for="confirm">Confirm</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3" />
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.3" />
                  <path d="M6 11l1.5 1.5L10 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <input
                  id="confirm"
                  type="password"
                  bind:value={confirm}
                  placeholder="••••••••"
                  autocomplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          {#if passwordHint}
            <p class="password-hint" class:ok={passwordHintOk}>{passwordHint}</p>
          {/if}

          {#if error}
            <div class="error-box" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3" />
                <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              {error}
            </div>
          {/if}

          <button class="submit-btn" type="submit" disabled={loading}>
            {#if loading}
              <span class="spinner" aria-hidden="true"></span>
              Creating account…
            {:else}
              Create account
            {/if}
          </button>

          <p class="terms">
            By signing up you agree to use Budol Map responsibly and follow local marketplace guidelines.
          </p>
        </form>

        <div class="divider"><span>or</span></div>

        <p class="footer-text">
          Already have an account? <a href={loginUrl(nextUrl)}>Sign in</a>
        </p>
      </div>
    </main>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    font-family: var(--font-sans);
  }

  .page-body {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(360px, 480px);
    min-height: calc(100vh - 56px);
  }

  .promo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2.5rem;
    overflow: hidden;
    background: var(--bg-card);
    border-right: 1px solid var(--border);
  }

  .promo-mesh {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.5;
  }

  .orb-a {
    width: 280px;
    height: 280px;
    background: rgba(255, 87, 34, 0.18);
    top: -60px;
    left: -40px;
  }

  .orb-b {
    width: 220px;
    height: 220px;
    background: rgba(33, 150, 243, 0.12);
    bottom: 10%;
    right: -30px;
  }

  .promo-inner {
    position: relative;
    max-width: 420px;
    z-index: 1;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 1rem;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    background: var(--primary-light);
    color: var(--budol-orange);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--budol-orange);
  }

  .promo h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.75rem, 4vw, 2.25rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    color: var(--text-dark);
  }

  .promo-lead {
    margin: 0 0 2rem;
    font-size: 15px;
    line-height: 1.65;
    color: var(--text-muted);
  }

  .perks {
    list-style: none;
    margin: 0 0 2rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .perks li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .perk-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    background: var(--bg-card);
    font-size: 18px;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  .perks strong {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 2px;
  }

  .perks span {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .seller-note {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .seller-note a {
    color: var(--budol-orange);
    font-weight: 600;
    text-decoration: none;
  }

  .seller-note a:hover {
    text-decoration: underline;
  }

  .form-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    background: var(--bg);
  }

  .card {
    width: 100%;
    max-width: 440px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem 1.75rem;
    box-shadow: var(--shadow-lg);
  }

  .card-head {
    margin-bottom: 1.5rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.25rem;
  }

  .brand-icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    background: var(--primary-light);
    border-radius: var(--radius-sm);
    font-size: 18px;
  }

  .brand-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
  }

  .card-head h2 {
    margin: 0 0 0.35rem;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-dark);
  }

  .subheading {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .input-wrap {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    transition: color 0.15s ease;
  }

  input {
    width: 100%;
    padding: 11px 12px 11px 36px;
    background: var(--bg-inset);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--text-dark);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input::placeholder {
    color: var(--text-muted);
  }

  input:focus {
    border-color: var(--budol-orange);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .input-wrap:focus-within .input-icon {
    color: var(--budol-orange);
  }

  .password-hint {
    margin: -4px 0 0;
    font-size: 12px;
    color: var(--alert-red);
  }

  .password-hint.ok {
    color: var(--success);
  }

  .error-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--error-bg);
    border: 1px solid rgba(244, 67, 54, 0.2);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    color: var(--alert-red);
    font-size: 13px;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    margin-top: 4px;
    background: var(--budol-orange);
    border: none;
    border-radius: var(--radius-pill);
    color: var(--text-inverse);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, transform 0.15s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--budol-orange-hover);
    transform: translateY(-1px);
  }

  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .terms {
    margin: 0;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-muted);
    text-align: center;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 1.25rem 0 1rem;
    font-size: 12px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .divider span {
    color: var(--text-muted);
  }

  .footer-text {
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
  }

  .footer-text a {
    color: var(--budol-orange);
    text-decoration: none;
    font-weight: 600;
  }

  .footer-text a:hover {
    text-decoration: underline;
  }

  @media (max-width: 900px) {
    .page-body {
      grid-template-columns: 1fr;
    }

    .promo {
      border-right: none;
      border-bottom: 1px solid var(--border);
      padding: 2rem 1.5rem;
    }

    .promo-inner {
      max-width: none;
    }

    .perks {
      margin-bottom: 1rem;
    }
  }

  @media (max-width: 520px) {
    .field-row {
      grid-template-columns: 1fr;
    }

    .card {
      padding: 1.5rem 1.25rem;
      box-shadow: var(--shadow-md);
    }
  }
</style>
