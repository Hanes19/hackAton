<script lang="ts">
  import { goto } from '$app/navigation'
  import { login } from '$lib/auth'

  let email = $state('')
  let password = $state('')
  let loading = $state(false)
  let error = $state('')

  async function submit() {
    loading = true
    error = ''
    const { error: err } = await login(email, password)
    loading = false
    if (err) error = err.message
    else goto('/')
  }
</script>

<div style="max-width: 400px; margin: 4rem auto; padding: 0 1rem;">
  <h1 style="font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem;">Login to LocalMarket</h1>

  <div style="display: flex; flex-direction: column; gap: 12px;">
    <div>
      <label for="email" style="font-size: 13px; color: #666;">Email</label>
      <input id="email" type="email" bind:value={email} placeholder="you@email.com" style="width: 100%; margin-top: 4px;" />
    </div>
    <div>
      <label for="password" style="font-size: 13px; color: #666;">Password</label>
      <input id="password" type="password" bind:value={password} placeholder="••••••••" style="width: 100%; margin-top: 4px;" />
    </div>

    {#if error}
      <div style="background: #fde8e8; border-radius: 8px; padding: 0.75rem; color: #9b2c2c; font-size: 13px;">{error}</div>
    {/if}

    <button onclick={submit} disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>

    <p style="font-size: 13px; text-align: center; color: #666;">
      No account? <a href="/register-user">Register here</a>
    </p>
  </div>
</div>