<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Map, Marker } from 'leaflet'

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
  let L: typeof import('leaflet')
  let markers: Marker[] = []

  function addMarkers() {
    if (!map || !L) return
    markers.forEach(m => m.remove())
    markers = []
    shops.forEach((shop) => {
      const m = L.marker([shop.lat, shop.lng])
        .addTo(map)
        .bindPopup(`<b>${shop.name}</b><br>${shop.category}<br><a href="/shops/${shop.id}">View shop</a>`)
      markers.push(m)
    })
  }

  $effect(() => {
    void shops
    addMarkers()
  })

  onMount(async () => {
    L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')

    map = L.map(mapEl).setView([8.0515, 125.1276], 10)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    addMarkers()
  })

  onDestroy(() => {
    if (map) map.remove()
  })
</script>

<div bind:this={mapEl} style="height: 100%; width: 100%;"></div>