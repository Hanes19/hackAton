<script lang="ts">
  import { goto } from '$app/navigation'
  import { register } from '$lib/auth'

  let name = $state('')
  let email = $state('')
  let password = $state('')
  let confirm = $state('')
  let loading = $state(false)
  let error = $state('')

  async function submit() {
    if (password !== confirm) { error = 'Passwords do not match'; return }
    loading = true
    error = ''
    const { error: err } = await register(email, password, name)
    loading = false
    if (err) error = err.message
    else goto('/')
  }
</script>

<div style="max-width: 400px; margin: 4rem auto; padding: 0 1rem;">
  <h1 style="font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem;">Create an account</h1>

  <div style="display: flex; flex-direction: column; gap: 12px;">
    <div>
      <label for="name" style="font-size: 13px; color: #666;">Full name</label>
      <input id="name" bind:value={name} placeholder="Juan dela Cruz" style="width: 100%; margin-top: 4px;" />
    </div>
    <div>
      <label for="email" style="font-size: 13px; color: #666;">Email</label>
      <input id="email" type="email" bind:value={email} placeholder="you@email.com" style="width: 100%; margin-top: 4px;" />
    </div>
    <div>
      <label for="password" style="font-size: 13px; color: #666;">Password</label>
      <input id="password" type="password" bind:value={password} placeholder="••••••••" style="width: 100%; margin-top: 4px;" />
    </div>
    <div>
      <label for="confirm" style="font-size: 13px; color: #666;">Confirm password</label>
      <input id="confirm" type="password" bind:value={confirm} placeholder="••••••••" style="width: 100%; margin-top: 4px;" />
    </div>

    {#if error}
      <div style="background: #fde8e8; border-radius: 8px; padding: 0.75rem; color: #9b2c2c; font-size: 13px;">{error}</div>
    {/if}

    <button onclick={submit} disabled={loading}>
      {loading ? 'Creating account...' : 'Register'}
    </button>

    <p style="font-size: 13px; text-align: center; color: #666;">
      Already have an account? <a href="/login">Login here</a>
    </p>
  </div>
</div>