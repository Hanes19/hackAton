<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import MapView from '$lib/MapView.svelte'
  import NavBar from '$lib/NavBar.svelte'
  import MapShopPanel from '$lib/MapShopPanel.svelte'
  import type { MapShop } from '$lib/mapShop'
  import type { GeoJsonObject } from 'geojson'

  interface OSRMResponse {
    routes: {
      geometry: GeoJsonObject
      distance: number
      duration: number
    }[]
  }

  let shops = $state<MapShop[]>([])
  let search = $state('')
  let selectedCategory = $state('All')
  let focusedShopId = $state<string | null>(null)
  let userLocation = $state<{ lat: number; lng: number } | null>(null)
  let travelMode = $state<'walking' | 'motorcycle' | 'car'>('motorcycle')

  let trackingLoading = $state(false)
  let isNavigating = $state(false)
  let watchId = $state<number | null>(null)
  let recenterTrigger = $state(0)

  let routeGeometry = $state<GeoJsonObject | null>(null)
  let routeDistance = $state<number | null>(null)
  let routeEta = $state<number | null>(null)
  let isRouting = $state(false)

  const categories = ['All', 'Food', 'Clothing', 'Electronics', 'Services', 'Health & Beauty']

  let filtered = $derived(
    shops.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        (s.products?.some((p) => p.name.toLowerCase().includes(search.toLowerCase())) ?? false)
      const matchCategory = selectedCategory === 'All' || s.category === selectedCategory
      return matchSearch && matchCategory
    })
  )

  let selectedShop = $derived(shops.find((s) => s.id === focusedShopId) || null)

  $effect(() => {
    if (userLocation && selectedShop) {
      isRouting = true
      const profile =
        travelMode === 'walking' ? 'foot' : travelMode === 'motorcycle' ? 'bike' : 'driving'

      const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation.lng},${userLocation.lat};${selectedShop.lng},${selectedShop.lat}?geometries=geojson&overview=full`

      fetch(url)
        .then((res) => res.json())
        .then((data: OSRMResponse) => {
          if (data.routes?.length) {
            routeGeometry = data.routes[0].geometry
            routeDistance = data.routes[0].distance / 1000
            routeEta = Math.ceil(data.routes[0].duration / 60)
          }
        })
        .finally(() => (isRouting = false))
    } else {
      routeGeometry = null
      routeDistance = null
      routeEta = null
    }
  })

  onMount(async () => {
    shops = await fetch('/api/shops').then((r) => r.json())
  })

  function handleGpsClick() {
    if (!navigator.geolocation) return alert('Geolocation not supported by this browser.')

    if (watchId !== null) {
      if (userLocation) recenterTrigger++
      return
    }

    trackingLoading = true

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        recenterTrigger++
        trackingLoading = false

        watchId = navigator.geolocation.watchPosition(
          (newPos) => {
            userLocation = { lat: newPos.coords.latitude, lng: newPos.coords.longitude }
          },
          (err) => console.warn('Background watcher error:', err),
          { enableHighAccuracy: true, maximumAge: 5000 }
        )
      },
      (err) => {
        console.error('GPS Error:', err)
        trackingLoading = false
        if (err.code === err.PERMISSION_DENIED) {
          alert(
            'Location permission denied. Please check your browser settings AND your Windows privacy settings.'
          )
        } else {
          alert("Could not lock your location. Ensure your device's location services are turned on.")
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
    )
  }

  function handleCategoryChange(cat: string) {
    selectedCategory = cat
    focusedShopId = null
    isNavigating = false
  }

  function handleSelectShop(id: string | null) {
    focusedShopId = id
    if (!id) isNavigating = false
  }

  function handleToggleNav() {
    isNavigating = !isNavigating
    if (isNavigating) recenterTrigger++
  }

  onDestroy(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  })
</script>

<div class="layout">
  <NavBar variant="dark" />

  <div class="explorer-content">
    <MapShopPanel
      {shops}
      {filtered}
      bind:search
      {selectedCategory}
      {categories}
      bind:focusedShopId
      {userLocation}
      {routeEta}
      {routeDistance}
      {isRouting}
      {travelMode}
      {isNavigating}
      onCategoryChange={handleCategoryChange}
      onSelectShop={handleSelectShop}
      onGpsClick={handleGpsClick}
      onToggleNav={handleToggleNav}
      onTravelModeChange={(mode) => (travelMode = mode)}
    />

    <main class="map-area">
      <MapView
        shops={filtered}
        selectedShopId={focusedShopId}
        {userLocation}
        {routeGeometry}
        {isNavigating}
        {recenterTrigger}
      />

      <button
        class="gps-trigger-btn"
        class:active={watchId !== null}
        onclick={handleGpsClick}
        disabled={trackingLoading}
        title="Center on my location"
      >
        {trackingLoading ? '⌛' : '🎯'}
      </button>
    </main>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #070f1f;
    font-family: -apple-system, sans-serif;
    overflow: hidden;
  }

  .layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #070f1f;
    color: #e8f4fc;
  }

  .explorer-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .map-area {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .gps-trigger-btn {
    position: absolute;
    bottom: 24px;
    right: 16px;
    width: 44px;
    height: 44px;
    background: #fff;
    border: 1px solid #dadce0;
    color: #1a73e8;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: background 0.2s;
  }

  .gps-trigger-btn:hover {
    background: #f8f9fa;
  }

  .gps-trigger-btn.active {
    background: #e6f4ea;
    border-color: #34a853;
    color: #137333;
  }
</style>
