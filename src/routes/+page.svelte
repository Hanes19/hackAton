<script lang="ts">
  import { onMount } from 'svelte'
  import MapView from '$lib/MapView.svelte'

  interface Shop {
    id: string
    name: string
    category: string
    lat: number
    lng: number
  }

  let shops = $state<Shop[]>([])

  onMount(async () => {
    const res = await fetch('/api/shops')
    shops = await res.json()
  })
</script>

<div style="height: 100vh; display: flex; flex-direction: column;">
    <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
    <h1 style="font-size: 1.2rem; font-weight: 600;">LocalMarket</h1>
    <a href="/register" style="font-size: 13px; background: #1a1a1a; color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none;">+ Add your shop</a>
    </header>
  <div style="flex: 1;">
    <MapView {shops} />
  </div>
</div>