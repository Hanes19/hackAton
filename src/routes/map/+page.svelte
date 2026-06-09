<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import MapView from '$lib/MapView.svelte'
  import { getUser, logout } from '$lib/auth'
  import type { User } from '@supabase/supabase-js'
  import type { GeoJsonObject } from 'geojson'

  interface Shop { id: string; name: string; category: string; lat: number; lng: number; address: string; description: string }

  interface OSRMResponse {
    routes: {
      geometry: GeoJsonObject;
      distance: number;
      duration: number;
    }[]
  }

  let shops = $state<Shop[]>([])
  let search = $state('')
  let selectedCategory = $state('All')
  let user = $state<User | null>(null)
  
  let focusedShopId = $state<string | null>(null)
  let userLocation = $state<{ lat: number; lng: number } | null>(null)
  let travelMode = $state<'walking' | 'motorcycle' | 'car'>('motorcycle')
  
  // Tracking States
  let trackingLoading = $state(false)
  let isNavigating = $state(false)
  let watchId = $state<number | null>(null)
  let recenterTrigger = $state(0) 

  let routeGeometry = $state<GeoJsonObject | null>(null)
  let routeDistance = $state<number | null>(null) 
  let routeEta = $state<number | null>(null)
  let isRouting = $state(false)
  let panelOffsetY = $state(0)
  let startY = $state(0)
  let isDragging = $state(false)

  const categories = ['All', 'Food', 'Clothing', 'Electronics', 'Services', 'Health & Beauty']

  let filtered = $derived(shops.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'All' || s.category === selectedCategory
    return matchSearch && matchCategory
  }))

  let selectedShop = $derived(shops.find(s => s.id === focusedShopId) || null)

  $effect(() => {
    if (userLocation && selectedShop) {
      isRouting = true;
      const profile = travelMode === 'walking' ? 'foot' : (travelMode === 'motorcycle' ? 'bike' : 'driving');
      
      const url = `https://router.project-osrm.org/route/v1/${profile}/${userLocation.lng},${userLocation.lat};${selectedShop.lng},${selectedShop.lat}?geometries=geojson&overview=full`;
      
      fetch(url)
        .then(res => res.json())
        .then((data: OSRMResponse) => { 
          if (data.routes && data.routes.length > 0) {
            routeGeometry = data.routes[0].geometry;
            routeDistance = data.routes[0].distance / 1000;
            routeEta = Math.ceil(data.routes[0].duration / 60);
          }
        })
        .finally(() => isRouting = false);
    } else {
      routeGeometry = null; routeDistance = null; routeEta = null;
    }
  });

  onMount(async () => {
    const [shopsRes, currentUser] = await Promise.all([
      fetch('/api/shops').then(r => r.json()),
      getUser()
    ])
    shops = shopsRes
    user = currentUser
  })

  function handleTouchStart(e: TouchEvent | MouseEvent) {
    startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    isDragging = true;
  }

  function handleTouchMove(e: TouchEvent | MouseEvent) {
    if (!isDragging) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY;
    if (diff > 0) panelOffsetY = diff; // Only allow dragging downwards
  }

  function handleTouchEnd() {
    isDragging = false;
    if (panelOffsetY > 120) {
      focusedShopId = null; // Close panel if dragged down far enough
    }
    panelOffsetY = 0; // Snap back if not dragged far enough
  }

  // Generate dynamic placeholder images based on the shop ID
  function getShopImages(shopId: string) {
    return [
      `https://picsum.photos/seed/${shopId}A/200/150`,
      `https://picsum.photos/seed/${shopId}B/200/150`,
      `https://picsum.photos/seed/${shopId}C/200/150`
    ];
  }

  // THE FIX: Bulletproof GPS locking mechanism
  function handleGpsClick() {
    if (!navigator.geolocation) return alert('Geolocation not supported by this browser.')
    
    // 1. If we are already tracking, snap the camera to user
    if (watchId !== null) {
      if (userLocation) recenterTrigger++
      return
    }

    trackingLoading = true
    
    // 2. Force a fast, LOW-ACCURACY initial lock to prevent Windows timeout crashes
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        recenterTrigger++
        trackingLoading = false
        
        // 3. Silently hand off to the continuous watcher in the background
        watchId = navigator.geolocation.watchPosition(
          (newPos) => {
            userLocation = { lat: newPos.coords.latitude, lng: newPos.coords.longitude }
          },
          (err) => console.warn("Background watcher error:", err),
          { enableHighAccuracy: true, maximumAge: 5000 }
        )
      },
      (err) => {
        console.error("GPS Error:", err)
        trackingLoading = false
        if (err.code === err.PERMISSION_DENIED) {
          alert('Location permission denied. Please check your browser settings AND your Windows privacy settings.')
        } else {
          alert('Could not lock your location. Ensure your device\'s location services are turned on.')
        }
      },
      // MAGIC FIX: High accuracy is FALSE for the initial ping so it doesn't hang!
      { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity } 
    )
  }

  onDestroy(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  })

  async function handleLogout() {
    await logout()
    user = null
    goto('/')
  }
</script>

<div class="layout">
  <header class="navbar">
    <div class="brand"><span class="brand-name" style="font-size: 1.2rem; font-weight: bold; color: white;">📍 Budol Map</span></div>
    <div class="search-wrap"><input bind:value={search} placeholder="Search products, shops, or locations..." class="search-input" /></div>
    <nav class="nav-actions">
      {#if user}
        <a href="/admin" class="btn-outline">Admin Panel</a>
        <button onclick={handleLogout} class="btn-outline" style="cursor: pointer;">Logout</button>
      {:else}
        <a href="/login" class="btn-outline">Login</a>
        <a href="/register-user" class="btn-primary">Register</a>
      {/if}
    </nav>
  </header>

  <div class="explorer-content">
    <aside class="feed-sidebar" class:nav-hidden={isNavigating}>
      <div class="filter-bar">
        {#each categories as cat (cat)}
          <button 
            class="pill" 
            class:active={selectedCategory === cat}
            onclick={() => { 
              selectedCategory = cat; 
              focusedShopId = null; // Dismiss the bottom sheet
              isNavigating = false; // Stop navigation if active
            }} 
          >
            {cat}
          </button>
        {/each}
      </div>

      <div class="product-feed">
        <div class="feed-stats">Showing {filtered.length} locations near you</div>
        <div class="product-grid">
          {#each filtered as shop (shop.id)}
            <div 
              class="product-card" class:selected={focusedShopId === shop.id}
              onclick={() => focusedShopId = shop.id} role="button" tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') focusedShopId = shop.id }}
            >
              <div class="product-image-area"><span class="mock-emoji">🏪</span><span class="geo-tag">📍 {shop.address || 'Bukidnon'}</span></div>
              <div class="product-info">
                <h3 class="product-title">{shop.name}</h3>
                <span class="badge category-badge">{shop.category}</span>
                <div class="product-meta"><a href="/shops/{shop.id}" class="view-btn" onclick={(e) => e.stopPropagation()}>View Details ➔</a></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </aside>

    <main class="map-area">
      <MapView shops={filtered} selectedShopId={focusedShopId} {userLocation} {routeGeometry} {isNavigating} {recenterTrigger} />

      <button class="gps-trigger-btn" class:active={watchId !== null} onclick={handleGpsClick} disabled={trackingLoading} title="Center on my location">
        {trackingLoading ? '⌛' : '🎯'}
      </button>

  {#if selectedShop}
    <div 
      class="shop-details-panel"
      role="dialog"
      aria-label="Shop Details"
      tabindex="-1"
      style="transform: translateY({panelOffsetY}px); transition: {isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'};"
      ontouchstart={handleTouchStart}
      ontouchmove={handleTouchMove}
      ontouchend={handleTouchEnd}
      onmousedown={handleTouchStart}
      onmousemove={handleTouchMove}
      onmouseup={handleTouchEnd}
      onmouseleave={handleTouchEnd}
    >
      <div class="panel-header">
        <h2 class="shop-title">{selectedShop.name}</h2>
        <p class="shop-subtitle">{selectedShop.category} • {selectedShop.address || 'Bukidnon'}</p>
      </div>

      {#if !isNavigating}
        <div class="image-gallery">
          {#each getShopImages(selectedShop.id) as photo (photo)}
            <img src={photo} alt="Shop view" class="shop-photo" draggable="false" />
          {/each}
        </div>
      {/if}

      {#if userLocation}
        <div class="routing-metrics-row" style={isNavigating ? "transform: scale(1.05); margin: 10px 0;" : ""}>
          <div class="metric-primary">
            <span class="eta">
              {#if isRouting} ... {:else if routeEta !== null && !isNaN(routeEta)} {routeEta} min {:else} -- {/if}
            </span>
            <span class="distance">
              {routeDistance !== null && !isNaN(routeDistance) ? `${routeDistance.toFixed(1)} km` : '...'}
            </span>
          </div>

          <div class="ride-selector">
            <button class="ride-btn" class:active={travelMode === 'car'} onclick={() => travelMode = 'car'}>🚗</button>
            <button class="ride-btn" class:active={travelMode === 'motorcycle'} onclick={() => travelMode = 'motorcycle'}>🏍️</button>
            <button class="ride-btn" class:active={travelMode === 'walking'} onclick={() => travelMode = 'walking'}>🚶</button>
          </div>
        </div>

        <button 
          class="action-btn" 
          style="background: {isNavigating ? '#ef4444' : '#3b82f6'};"
          onclick={() => { isNavigating = !isNavigating; if (isNavigating) recenterTrigger++; else panelOffsetY = 0; }}
        >
          {isNavigating ? '⏹ End Route' : '▶ Start Navigation'}
        </button>
      {:else}
        <div class="no-gps-state">
          <p>Enable location tracking to see routes.</p>
          <button class="btn-primary" onclick={handleGpsClick}>Enable GPS Tracking</button>
        </div>
      {/if}

      {#if !isNavigating}
        <div class="shop-description-box">
          <h4>About this location</h4>
          <p>{selectedShop.description || 'A fantastic local spot offering the best products and services in the area.'}</p>
        </div>
      {/if}
    </div>
  {/if}
    </main>
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; background: #070f1f; font-family: -apple-system, sans-serif; overflow: hidden; }
  .layout { height: 100vh; display: flex; flex-direction: column; background: #070f1f; color: #e8f4fc; }

  /* Navbar */
  .navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 1.25rem; height: 60px; background: #0c1a35; border-bottom: 1px solid rgba(73, 182, 234, 0.15); z-index: 100; }
  .search-wrap { flex: 1; max-width: 400px; margin: 0 2rem; }
  .search-input { width: 100%; padding: 8px 16px; background: #091525; border: 1px solid #143e88; border-radius: 8px; color: #fff; outline: none; }
  .search-input:focus { border-color: #49b6ea; }
  .nav-actions { display: flex; gap: 10px; }
  .btn-primary { background: #3b82f6; color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; border: none; cursor: pointer; transition: background 0.2s; }
  .btn-outline { background: transparent; border: 1px solid rgba(73, 182, 234, 0.3); color: #84b9d5; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 13px; cursor: pointer; }

  /* Content Shell Structure */
  .explorer-content { display: flex; flex: 1; overflow: hidden; }
  .feed-sidebar { 
    width: 400px; background: #091525; display: flex; flex-direction: column; 
    border-right: 1px solid rgba(20, 62, 136, 0.6); z-index: 10; flex-shrink: 0; 
    transition: margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s; /* Added transitions */
  }
  
  /* New class to hide sidebar gracefully */
  .feed-sidebar.nav-hidden {
    margin-left: -400px;
    opacity: 0;
    pointer-events: none;
  }
  .filter-bar { display: flex; gap: 8px; padding: 12px 1rem; overflow-x: auto; background: #0c1a35; border-bottom: 1px solid rgba(20, 62, 136, 0.6); scrollbar-width: none; }
  .filter-bar::-webkit-scrollbar { display: none; }
  .pill { background: transparent; border: 1px solid rgba(20, 62, 136, 0.7); color: #4d7a9e; padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; white-space: nowrap; }
  .pill.active { background: #3b82f6; border-color: #3b82f6; color: white; }

  .product-feed { flex: 1; overflow-y: auto; }
  .feed-stats { padding: 1rem 1rem 0.5rem; font-size: 12px; color: #4d7a9e; }
  .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0.5rem 1rem 2rem; }
  
  .product-card { background: #0c1a35; border: 1px solid rgba(20, 62, 136, 0.4); border-radius: 8px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: all 0.2s; outline: none; }
  .product-card:hover, .product-card:focus-visible { transform: translateY(-3px); border-color: #49b6ea; }
  .product-card.selected { border: 2px solid #3b82f6; box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
  
  .product-image-area { height: 100px; background: #070f1f; display: flex; align-items: center; justify-content: center; position: relative; }
  .mock-emoji { font-size: 3rem; }
  .geo-tag { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.7); font-size: 10px; padding: 3px 6px; border-radius: 4px; color: #49b6ea; }
  
  .product-info { padding: 10px; display: flex; flex-direction: column; flex: 1; }
  .product-title { margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #e8f4fc; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .category-badge { background: rgba(13, 88, 176, 0.3); color: #49b6ea; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; margin-bottom: 10px; align-self: flex-start; }
  .product-meta { display: flex; justify-content: space-between; margin-top: auto; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; }
  .view-btn { font-size: 11px; color: #49b6ea; font-weight: 600; text-decoration: none; }

  .map-area { flex: 1; min-height: 0; position: relative; }

  .gps-trigger-btn { position: absolute; bottom: 110px; right: 10px; width: 44px; height: 44px; background: #0c1a35; border: 1px solid #143e88; color: white; border-radius: 8px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: background 0.2s; }
  .gps-trigger-btn:hover { background: #143e88; }
  .gps-trigger-btn.active { background: #10b981; border-color: #34d399; color: white; }

  /* Expanded Shop Details Panel */
  .shop-details-panel { 
    position: absolute; bottom: 16px; left: 16px; width: calc(100% - 32px); max-width: 380px; 
    background: rgba(12, 26, 53, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(73, 182, 234, 0.2); 
    border-radius: 20px; padding: 1.25rem; z-index: 1000; box-shadow: 0 -10px 40px rgba(0,0,0,0.6); 
    display: flex; flex-direction: column; gap: 14px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
  }
  @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  
  
  .panel-header .shop-title { margin: 0; font-size: 1.4rem; font-weight: 700; color: #fff; line-height: 1.2; }
  .panel-header .shop-subtitle { margin: 4px 0 0; font-size: 0.85rem; color: #84b9d5; }

  /* Horizontal Scrolling Image Gallery */
  .image-gallery { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
  .image-gallery::-webkit-scrollbar { display: none; }
  

  /* Metrics Row (ETA & Ride Mode) */
  .routing-metrics-row { display: flex; align-items: center; justify-content: space-between; background: #091525; padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(20, 62, 136, 0.5); }
  .metric-primary { display: flex; align-items: baseline; gap: 8px; }
  .metric-primary .eta { font-size: 1.2rem; font-weight: 800; color: #49b6ea; }
  .metric-primary .distance { font-size: 0.9rem; color: #84b9d5; font-weight: 500; }

  /* Big Action Button */
  .action-btn { width: 100%; padding: 14px; border-radius: 12px; color: white; font-weight: 700; font-size: 15px; border: none; cursor: pointer; transition: transform 0.1s, filter 0.2s; display: flex; justify-content: center; align-items: center; }
  .action-btn:active { transform: scale(0.98); }
  .action-btn:hover { filter: brightness(1.1); }

  /* Description text area */
  .shop-description-box { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; }
  .shop-description-box h4 { margin: 0 0 6px; font-size: 0.9rem; color: #fff; font-weight: 600; }
  .shop-description-box p { margin: 0; font-size: 0.85rem; color: #a1c9e3; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

  .no-gps-state { text-align: center; padding: 1rem 0; }
  .no-gps-state p { font-size: 13px; color: #84b9d5; margin: 0 0 12px 0; }

  .ride-selector { display: flex; gap: 4px; background: #070f1f; padding: 2px; border-radius: 6px; }
  .ride-btn { flex: 1; background: transparent; border: none; color: #84b9d5; padding: 6px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .ride-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .ride-btn.active { background: #3b82f6; color: white; font-weight: 600; }

  .shop-photo { height: 100px; width: 140px; object-fit: cover; border-radius: 10px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); pointer-events: none; }
  
</style>