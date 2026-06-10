<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Map, Marker } from 'leaflet'
  import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '$lib/mapTheme'

  interface Props {
    shopLat?: number | null
    shopLng?: number | null
    shopName?: string
    trackerLat?: number | null
    trackerLng?: number | null
    trackerLabel?: string
  }

  let {
    shopLat,
    shopLng,
    shopName = 'Shop',
    trackerLat,
    trackerLng,
    trackerLabel = 'Live location'
  }: Props = $props()

  let mapEl: HTMLDivElement
  let map = $state<Map | undefined>()
  let L = $state<typeof import('leaflet') | undefined>()
  let shopMarker: Marker | null = null
  let trackerMarker: Marker | null = null

  function syncMarkers() {
    if (!map || !L) return

    if (shopMarker) shopMarker.remove()
    if (trackerMarker) trackerMarker.remove()
    shopMarker = null
    trackerMarker = null

    const bounds: [number, number][] = []

    if (shopLat != null && shopLng != null) {
      const shopIcon = L.divIcon({
        className: 'track-shop-pin',
        html: '<div class="pin">🏪</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
      shopMarker = L.marker([shopLat, shopLng], { icon: shopIcon })
        .addTo(map)
        .bindPopup(shopName)
      bounds.push([shopLat, shopLng])
    }

    if (trackerLat != null && trackerLng != null) {
      const trackIcon = L.divIcon({
        className: 'track-live-pin',
        html: '<div class="live-pin"><span class="dot"></span></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
      trackerMarker = L.marker([trackerLat, trackerLng], { icon: trackIcon, zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(trackerLabel)
      bounds.push([trackerLat, trackerLng])
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 15)
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    } else {
      map.setView([8.0167, 125.0333], 10)
    }
  }

  $effect(() => {
    void shopLat
    void shopLng
    void trackerLat
    void trackerLng
    syncMarkers()
  })

  onMount(async () => {
    L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')
    map = L.map(mapEl, { zoomControl: true }).setView([8.0167, 125.0333], 10)
    L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    syncMarkers()
  })

  onDestroy(() => {
    map?.remove()
  })
</script>

<div bind:this={mapEl} class="tracking-map"></div>

<style>
  .tracking-map {
    width: 100%;
    height: 260px;
    border-radius: var(--radius-md, 12px);
    overflow: hidden;
    border: 1px solid var(--border, #e0e0e0);
  }

  :global(.track-shop-pin .pin),
  :global(.track-live-pin .live-pin) {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  }

  :global(.track-live-pin .dot) {
    width: 16px;
    height: 16px;
    background: #1a73e8;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 6px rgba(26, 115, 232, 0.25);
  }
</style>
