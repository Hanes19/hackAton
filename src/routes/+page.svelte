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
  <header style="padding: 1rem 1.5rem; border-bottom: 1px solid #eee;">
    <h1 style="font-size: 1.2rem; font-weight: 600;">LocalMarket</h1>
  </header>
  <div style="flex: 1;">
    <MapView {shops} />
  </div>
</div>