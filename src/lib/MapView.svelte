<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Map, Marker, GeoJSON } from 'leaflet'

  interface Shop { id: string; name: string; category: string; lat: number; lng: number }
  
  // NEW: Explicit TypeScript interface to replace 'any'
  interface RouteGeometry {
    type: string;
    coordinates: number[][];
  }

  let { 
    shops = [], 
    selectedShopId = null, 
    userLocation = null,
    routeGeometry = null,
    isNavigating = false
  }: { 
    shops: Shop[], 
    selectedShopId?: string | null, 
    userLocation: { lat: number; lng: number } | null,
    routeGeometry: RouteGeometry | null,
    isNavigating?: boolean
  } = $props()

  let mapEl: HTMLDivElement
  let map: Map
  let L: typeof import('leaflet')
  let markers: Record<string, Marker> = {}
  let userMarker: Marker | null = null
  let routeLayer: GeoJSON | null = null

  function addMarkers() {
    if (!map || !L) return
    Object.values(markers).forEach(m => m.remove())
    markers = {}
    shops.forEach((shop) => {
      const m = L.marker([shop.lat, shop.lng])
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center; font-family: sans-serif; color: #111;">
            <b style="font-size: 14px;">${shop.name}</b><br>
            <span style="color: #666; font-size: 12px;">${shop.category}</span><br>
            <a href="/shops/${shop.id}" style="display: inline-block; margin-top: 8px; background: #0d58b0; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600;">View Shop</a>
          </div>
        `)
      markers[shop.id] = m
    })
  }

  $effect(() => { void shops; addMarkers() })

  // Live GPS Marker & Camera Follow Logic
  $effect(() => {
    if (map && L && userLocation) {
      if (userMarker) userMarker.remove()
      
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `<div class="gps-dot"></div><div class="gps-pulse"></div>`,
        iconSize: [20, 20]
      })
      userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map)
      
      if (isNavigating) {
        map.flyTo([userLocation.lat, userLocation.lng], 18, { animate: true, duration: 0.5 })
      }
    }
  })

  // Routing Path Logic
  $effect(() => {
    if (map && L) {
      if (routeLayer) routeLayer.remove()
      
      if (routeGeometry) {
        routeLayer = L.geoJSON(routeGeometry as any, {
          style: { color: '#3b82f6', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }
        }).addTo(map)

        if (!isNavigating) {
          map.fitBounds(routeLayer.getBounds(), { padding: [50, 50], animate: true, duration: 1 })
        }
      } 
      else if (selectedShopId && markers[selectedShopId] && !isNavigating) {
        const shop = shops.find(s => s.id === selectedShopId)
        if (shop) {
          map.flyTo([shop.lat, shop.lng], 16, { animate: true, duration: 1.2 })
          markers[selectedShopId].openPopup()
        }
      }
    }
  })

  onMount(async () => {
    L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')
    map = L.map(mapEl, { zoomControl: false }).setView([8.0167, 125.0333], 9)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map)
    addMarkers()
  })

  onDestroy(() => { if (map) map.remove() })
</script>

<div bind:this={mapEl} style="height: 100%; width: 100%; z-index: 1;"></div>

<style>
  :global(.leaflet-popup-content-wrapper) { border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
  :global(.user-gps-marker) { display: flex; align-items: center; justify-content: center; }
  :global(.gps-dot) { width: 16px; height: 16px; background: #10b981; border: 3px solid white; border-radius: 50%; z-index: 2; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
  :global(.gps-pulse) { position: absolute; width: 48px; height: 48px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: gpsPulse 2s infinite ease-out; z-index: 1; }
  @keyframes gpsPulse { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
</style>