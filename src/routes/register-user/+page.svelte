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

  async function submit() {
    if (password !== confirm) { error = 'Passwords do not match'; return }
    loading = true
    error = ''
    const { error: err } = await register(email, password, name)
    loading = false
    if (err) error = err.message
    else goto(nextUrl)
  }
</script>

<div class="page">
  <NavBar variant="light" />
  <div class="page-body">
  <div class="card">

    <!-- Brand -->
    <div class="brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 6l7-4 7 4v8l-7 4-7-4V6z" stroke="#79E0E9" stroke-width="1.5" fill="none"/>
          <path d="M10 2v16M3 6l7 4 7-4" stroke="#49B6EA" stroke-width="1.5"/>
        </svg>
      </div>
      <span class="brand-name">LocalMarket</span>
    </div>

    <h1 class="heading">Create an account</h1>
    <p class="subheading">Join LocalMarket to get started</p>

    <div class="fields">
      <div class="field">
        <label for="name">Full name</label>
        <div class="input-wrap">
          <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input id="name" bind:value={name} placeholder="Juan dela Cruz" autocomplete="name" />
        </div>
      </div>

      <div class="field">
        <label for="email">Email address</label>
        <div class="input-wrap">
          <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          <input id="email" type="email" bind:value={email} placeholder="you@email.com" autocomplete="email" />
        </div>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="input-wrap">
          <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          <input id="password" type="password" bind:value={password} placeholder="••••••••" autocomplete="new-password" />
        </div>
      </div>

      <div class="field">
        <label for="confirm">Confirm password</label>
        <div class="input-wrap">
          <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M6 11l1.5 1.5L10 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input id="confirm" type="password" bind:value={confirm} placeholder="••••••••" autocomplete="new-password" />
        </div>
      </div>

      {#if error}
        <div class="error-box">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#f87171" stroke-width="1.3"/>
            <path d="M7 4v3.5M7 9.5v.5" stroke="#f87171" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {error}
        </div>
      {/if}

      <button class="submit-btn" onclick={submit} disabled={loading}>
        {#if loading}
          <svg class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
            <path d="M8 2a6 6 0 016 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Creating account…
        {:else}
          Create account
        {/if}
      </button>
    </div>

    <div class="divider"><span>or</span></div>

    <p class="footer-text">
      Already have an account? <a href={loginUrl(nextUrl)}>Sign in</a>
    </p>
  </div>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--surface-deepest);
    background-image: var(--gradient-page-dark);
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
    background: var(--surface-darker);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2.5rem 2rem;
    box-shadow:
      0 0 0 1px rgba(20, 62, 136, 0.4),
      0 24px 60px rgba(0, 0, 0, 0.5),
      0 0 80px rgba(13, 88, 176, 0.08);
  }

  /* Brand */
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
    border-radius: 8px;
    display: grid;
    place-items: center;
  }
  .brand-name {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #84b9d5;
  }

  /* Headings */
  .heading {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #e8f4fc;
    margin: 0 0 0.25rem;
    line-height: 1.2;
  }
  .subheading {
    font-size: 13.5px;
    color: #4d7a9e;
    margin: 0 0 1.75rem;
  }

  /* Fields */
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
    letter-spacing: 0.02em;
    color: #6eb3da;
    text-transform: uppercase;
  }
  .input-wrap {
    position: relative;
  }
  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #2d5580;
    pointer-events: none;
    transition: color 0.2s;
  }
  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    background: var(--surface-deepest);
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }
  input::placeholder {
    color: #2d5580;
  }
  input:focus {
    border-color: var(--accent-warm);
    box-shadow: 0 0 0 3px var(--primary-light);
  }
  .input-wrap:focus-within .input-icon {
    color: var(--accent-warm);
  }

  /* Error */
  .error-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(248, 113, 113, 0.08);
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 8px;
    padding: 10px 12px;
    color: #f87171;
    font-size: 13px;
  }

  /* Button */
  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 11px;
    margin-top: 6px;
    background: var(--gradient-brand);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    font-family: inherit;
    box-shadow: 0 4px 20px rgba(13, 88, 176, 0.4);
  }
  .submit-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .submit-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  /* Spinner */
  .spinner {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Divider */
  .divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 1.5rem 0 1rem;
    color: #1e3a5f;
    font-size: 12px;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #1a3258;
  }
  .divider span {
    color: #2d5580;
  }

  /* Footer */
  .footer-text {
    text-align: center;
    font-size: 13px;
    color: #3a6080;
    margin: 0;
  }
  .footer-text a {
    color: var(--accent-warm);
    text-decoration: none;
    font-weight: 500;
  }
  .footer-text a:hover {
    color: #79e0e9;
    text-decoration: underline;
  }
</style>