<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { page } from '$app/stores'
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
  import type MapViewComponent from '$lib/MapView.svelte'
  import { assistantPanelOpen } from '$lib/assistantPanel'

  let mapView = $state<MapViewComponent | undefined>(undefined)
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
    const q = $page.url.searchParams.get('q')
    if (q) search = q
  })

  $effect(() => {
    const q = $page.url.searchParams.get('q')
    if (q && q !== search) search = q
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
      bind:this={mapView}
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

    <div class="map-dock-stack">
      {#if !$assistantPanelOpen}
        <p class="help-bubble" aria-hidden="true">You need help?</p>
      {/if}

      <button
        type="button"
        class="dock-ai-btn"
        class:active={$assistantPanelOpen}
        onclick={() => assistantPanelOpen.update((v) => !v)}
        aria-label="Open Budol Assistant"
        aria-expanded={$assistantPanelOpen}
      >
        <span class="dock-ai-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3l1.2 3.6H17l-3 2.2 1.1 3.4L12 10.6 8.9 12.2l1.1-3.4-3-2.2h3.8L12 3z" fill="currentColor" />
          </svg>
        </span>
        <span class="dock-ai-copy">
          <strong>Ask AI</strong>
          <small>Search products</small>
        </span>
      </button>

      <nav class="map-dock" aria-label="Map controls">
      <button
        type="button"
        class="dock-btn"
        onclick={() => mapView?.zoomIn()}
        aria-label="Zoom in"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <button
        type="button"
        class="dock-btn"
        onclick={() => mapView?.zoomOut()}
        aria-label="Zoom out"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <span class="dock-divider" aria-hidden="true"></span>

      <button
        type="button"
        class="dock-btn locate"
        class:active={gpsActive}
        onclick={handleGpsClick}
        disabled={trackingLoading}
        aria-label="Track my location"
      >
        {#if trackingLoading}
          <span class="dock-spinner" aria-hidden="true"></span>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        {/if}
      </button>
      </nav>
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

  .map-dock-stack {
    position: absolute;
    bottom: 20px;
    right: 16px;
    z-index: 500;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .help-bubble {
    margin: 0;
    padding: 8px 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-md);
    font-size: 13px;
    font-weight: 700;
    color: var(--budol-orange);
    animation: bubbleFloat 2.5s ease-in-out infinite;
    position: relative;
  }

  .help-bubble::after {
    content: '';
    position: absolute;
    right: 28px;
    bottom: -6px;
    width: 12px;
    height: 12px;
    background: var(--bg-card);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    transform: rotate(45deg);
  }

  @keyframes bubbleFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .dock-ai-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 148px;
    padding: 12px 16px;
    border: none;
    border-radius: var(--radius-pill);
    background: linear-gradient(135deg, var(--budol-orange) 0%, var(--budol-orange-hover) 100%);
    color: white;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 8px 28px rgba(255, 87, 34, 0.45);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .dock-ai-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(255, 87, 34, 0.5);
  }

  .dock-ai-btn.active {
    outline: 3px solid var(--primary-light);
  }

  .dock-ai-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .dock-ai-icon svg {
    width: 22px;
    height: 22px;
  }

  .dock-ai-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
  }

  .dock-ai-copy strong {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .dock-ai-copy small {
    font-size: 11px;
    opacity: 0.9;
    font-weight: 500;
  }

  .map-dock {
    display: flex;
    flex-direction: column;
    width: 48px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }

  .dock-btn {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--bg-card);
    color: var(--text-dark);
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease;
  }

  .dock-btn svg {
    width: 22px;
    height: 22px;
  }

  .dock-btn:hover:not(:disabled) {
    background: var(--bg);
  }

  .dock-btn:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .dock-btn.locate {
    color: var(--pin-blue);
  }

  .dock-btn.locate.active {
    background: rgba(33, 150, 243, 0.1);
  }

  .dock-divider {
    height: 1px;
    background: var(--border);
    flex-shrink: 0;
  }

  .dock-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--pin-blue);
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

    .map-dock-stack {
      top: 72px;
      bottom: auto;
      right: 12px;
    }

    .dock-ai-btn {
      min-width: 0;
      width: 52px;
      height: 52px;
      padding: 0;
      justify-content: center;
      border-radius: 50%;
    }

    .dock-ai-copy {
      display: none;
    }

    .help-bubble {
      font-size: 12px;
      padding: 6px 12px;
    }
  }
</style>
