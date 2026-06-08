<script lang="ts">
  import { goto } from '$app/navigation'

  let name = $state('')
  let description = $state('')
  let category = $state('Food')
  let address = $state('')
  let lat = $state(14.5995)
  let lng = $state(120.9842)
  let loading = $state(false)
  let success = $state(false)
  let error = $state('')

  async function submit() {
    loading = true
    error = ''
    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, category, address, lat, lng })
    })
    const data = await res.json()
    loading = false
    if (data.error) {
      error = data.error
    } else {
      success = true
    }
  }
</script>

<div style="max-width: 480px; margin: 2rem auto; padding: 0 1rem;">
  <a href="/" onclick={() => goto('/')} style="font-size: 13px; color: #666;">← Back to map</a>
  <h1 style="font-size: 1.4rem; font-weight: 600; margin: 1rem 0;">Register your shop</h1>

  {#if success}
    <div style="background: #e6f4ea; border-radius: 8px; padding: 1rem; color: #2d6a4f;">
      Shop registered! <a href="/" onclick={() => goto('/')}>View on map →</a>
    </div>
  {:else}
    <div style="display: flex; flex-direction: column; gap: 12px;">

      <div>
        <label for="name" style="font-size: 13px; color: #666;">Shop name</label>
        <input id="name" bind:value={name} placeholder="e.g. Juan's Bakery" style="width: 100%; margin-top: 4px;" />
      </div>

      <div>
        <label for="category" style="font-size: 13px; color: #666;">Category</label>
        <select id="category" bind:value={category} style="width: 100%; margin-top: 4px;">
          <option>Food</option>
          <option>Clothing</option>
          <option>Electronics</option>
          <option>Services</option>
          <option>Health & Beauty</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label for="description" style="font-size: 13px; color: #666;">Description</label>
        <textarea id="description" bind:value={description} placeholder="What do you sell?" rows="3" style="width: 100%; margin-top: 4px;"></textarea>
      </div>

      <div>
        <label for="address" style="font-size: 13px; color: #666;">Address</label>
        <input id="address" bind:value={address} placeholder="e.g. 123 Rizal St, Manila" style="width: 100%; margin-top: 4px;" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label for="lat" style="font-size: 13px; color: #666;">Latitude</label>
          <input id="lat" type="number" bind:value={lat} step="0.0001" style="width: 100%; margin-top: 4px;" />
        </div>
        <div>
          <label for="lng" style="font-size: 13px; color: #666;">Longitude</label>
          <input id="lng" type="number" bind:value={lng} step="0.0001" style="width: 100%; margin-top: 4px;" />
        </div>
      </div>

      <p style="font-size: 12px; color: #999;">Tip: right-click anywhere on Google Maps → "What's here?" to get coordinates.</p>

      {#if error}
        <div style="background: #fde8e8; border-radius: 8px; padding: 0.75rem; color: #9b2c2c; font-size: 13px;">{error}</div>
      {/if}

      <button onclick={submit} disabled={loading} style="margin-top: 4px;">
        {loading ? 'Registering...' : 'Register shop'}
      </button>
    </div>
  {/if}
</div>