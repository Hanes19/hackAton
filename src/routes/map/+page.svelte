<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import MapView from '$lib/MapView.svelte'
  import NavBar from '$lib/NavBar.svelte'
  import MapShopPanel from '$lib/MapShopPanel.svelte'
  import {
    MAP_CATEGORIES,
    filterShops,
    fetchMapShops,
    fetchRoute,
    createGpsTracker,
    type TravelMode
  } from '$lib/mapExplorer'
  import type { MapShop } from '$lib/mapShop'
  import type { GeoJsonObject } from 'geojson'

  let shops = $state<MapShop[]>([])
  let search = $state('')
  let selectedCategory = $state('All')
  let focusedShopId = $state<string | null>(null)
  let userLocation = $state<{ lat: number; lng: number } | null>(null)
  let travelMode = $state<TravelMode>('motorcycle')

  let trackingLoading = $state(false)
  let isNavigating = $state(false)
  let recenterTrigger = $state(0)

  let routeGeometry = $state<GeoJsonObject | null>(null)
  let routeDistance = $state<number | null>(null)
  let routeEta = $state<number | null>(null)
  let isRouting = $state(false)

  let gpsActive = $state(false)

  const categories = MAP_CATEGORIES
  let filtered = $derived(filterShops(shops, search, selectedCategory))
  let selectedShop = $derived(shops.find((s) => s.id === focusedShopId) ?? null)

  const gps = createGpsTracker({
    onLocation: (loc) => {
      userLocation = loc
    },
    onLoading: (loading) => {
      trackingLoading = loading
    },
    onRecenter: () => {
      recenterTrigger++
    },
    onActiveChange: (active) => {
      gpsActive = active
    }
  })

  $effect(() => {
    if (userLocation && selectedShop) {
      isRouting = true
      fetchRoute(userLocation, selectedShop, travelMode)
        .then((route) => {
          routeGeometry = route.geometry
          routeDistance = route.distance
          routeEta = route.eta
        })
        .finally(() => {
          isRouting = false
        })
    } else {
      routeGeometry = null
      routeDistance = null
      routeEta = null
    }
  })

  onMount(async () => {
    shops = await fetchMapShops()
  })

  function handleGpsClick() {
    gps.start()
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
    gps.stop()
  })
</script>

<svelte:head>
  <title>Map — Budol Map</title>
</svelte:head>

<div class="map-page">
  <NavBar variant="light" />

  <section class="map-stage" aria-label="Shop explorer map">
    <MapView
      shops={filtered}
      selectedShopId={focusedShopId}
      {userLocation}
      {routeGeometry}
      {isNavigating}
      {recenterTrigger}
      onSelectShop={(id) => handleSelectShop(id)}
    />

    <div class="panel-dock" class:expanded={focusedShopId !== null}>
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
    </div>

    <div class="map-controls">
      <button
        type="button"
        class="control-btn gps-btn"
        class:active={gpsActive}
        onclick={handleGpsClick}
        disabled={trackingLoading}
        title="Center on my location"
        aria-label="Center on my location"
      >
        {#if trackingLoading}
          <span class="control-icon loading" aria-hidden="true"></span>
        {:else}
          <svg class="control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" />
          </svg>
        {/if}
      </button>
    </div>
  </section>
</div>

<style>
  :global(body:has(.map-page)) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .map-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--text-dark);
    font-family: var(--font-sans);
  }

  .map-stage {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }

  .panel-dock {
    position: absolute;
    top: 16px;
    left: 16px;
    bottom: 16px;
    z-index: 500;
    width: min(380px, calc(100vw - 32px));
    pointer-events: none;
    transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .panel-dock.expanded {
    width: min(700px, calc(100vw - 32px));
  }

  .panel-dock :global(.explorer-panel) {
    pointer-events: auto;
    height: 100%;
  }

  .map-controls {
    position: absolute;
    bottom: 24px;
    right: 16px;
    z-index: 500;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-btn {
    width: 44px;
    height: 44px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transition:
      background 0.2s,
      border-color 0.2s,
      transform 0.15s;
  }

  .control-btn:hover:not(:disabled) {
    background: var(--bg2);
    transform: scale(1.04);
  }

  .control-btn.active {
    background: rgba(33, 150, 243, 0.12);
    border-color: var(--pin-blue);
    color: var(--pin-blue);
  }

  .control-btn:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .control-icon {
    width: 22px;
    height: 22px;
  }

  .control-icon.loading {
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .panel-dock,
    .panel-dock.expanded {
      top: auto;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 58vh;
      max-height: 520px;
    }

    .panel-dock :global(.explorer-panel) {
      max-width: none;
      border-radius: 16px 16px 0 0;
    }

    .panel-dock :global(.explorer-panel.nav-hidden) {
      transform: translateY(100%);
    }

    .map-controls {
      bottom: calc(52vh + 16px);
      right: 12px;
    }
  }
</style>
