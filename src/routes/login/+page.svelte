<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { login } from '$lib/auth'
  import { safeRedirect, registerUserUrl } from '$lib/navigation'
  import NavBar from '$lib/NavBar.svelte'

  let email = $state('')
  let password = $state('')
  let loading = $state(false)
  let error = $state('')

  let redirectTo = $derived(safeRedirect($page.url.searchParams.get('redirect'), '/'))

  async function submit() {
    loading = true
    error = ''
    const { error: err } = await login(email, password)
    loading = false
    if (err) error = err.message
    else goto(redirectTo)
  }
</script>

<div class="page">
  <NavBar variant="light" />
  <div class="page-body">
    <div class="card">
      <div class="brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6l7-4 7 4v8l-7 4-7-4V6z" stroke="var(--accent-warm)" stroke-width="1.5" fill="none" />
            <path d="M10 2v16M3 6l7 4 7-4" stroke="var(--primary)" stroke-width="1.5" />
          </svg>
        </div>
        <span class="brand-name">Budol Map</span>
      </div>

      <h1 class="heading">Welcome back</h1>
      <p class="subheading">Sign in to your account</p>

      <div class="fields">
        <div class="field">
          <label for="email">Email address</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3" />
              <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" stroke-width="1.3" />
            </svg>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@email.com"
              autocomplete="email"
            />
          </div>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3" />
              <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.3" />
            </svg>
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>
        </div>

        {#if error}
          <div class="error-box">{error}</div>
        {/if}

        <button class="submit-btn" onclick={submit} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <div class="divider"><span>or</span></div>

      <p class="footer-text">
        New to Budol Map? <a href={registerUserUrl(redirectTo)}>Create an account</a>
      </p>
    </div>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    padding: 1.5rem;
    font-family: var(--font-sans);
  }

  .page-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    width: 100%;
    box-sizing: border-box;
  }

  .card {
    width: 100%;
    max-width: 400px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2.5rem 2rem;
    box-shadow: var(--shadow-lg);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.75rem;
  }

  .brand-icon {
    width: 34px;
    height: 34px;
    background: var(--primary-light);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
  }

  .brand-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .heading {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-dark);
    margin: 0 0 0.25rem;
  }

  .subheading {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 0 0 1.75rem;
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
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
  }

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    background: var(--bg-inset);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--text-dark);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  input::placeholder {
    color: var(--text-muted);
  }

  input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .input-wrap:focus-within .input-icon {
    color: var(--primary);
  }

  .error-box {
    background: var(--error-bg);
    border: 1px solid rgba(196, 107, 107, 0.3);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    color: var(--error);
    font-size: 13px;
  }

  .submit-btn {
    width: 100%;
    padding: 11px;
    margin-top: 6px;
    background: var(--budol-orange);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-inverse);
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: opacity 0.2s, transform 0.15s;
  }

  .submit-btn:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 1.5rem 0 1rem;
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
    font-weight: 500;
  }

  .footer-text a:hover {
    color: var(--text-dark);
    text-decoration: underline;
  }
</style>
