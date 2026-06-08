<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Map } from 'leaflet'

  interface Shop {
    id: string
    name: string
    category: string
    lat: number
    lng: number
  }

  let { shops = [] }: { shops: Shop[] } = $props()

  let mapEl: HTMLDivElement
  let map: Map

  onMount(async () => {
    const L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')

    map = L.map(mapEl).setView([14.5995, 120.9842], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    shops.forEach((shop) => {
      L.marker([shop.lat, shop.lng])
        .addTo(map)
        .bindPopup(`<b>${shop.name}</b><br>${shop.category}<br><a href="/shops/${shop.id}">View shop</a>`)
    })
  })

  onDestroy(() => {
    if (map) map.remove()
  })
</script>

<div bind:this={mapEl} style="height: 100%; width: 100%;"></div>