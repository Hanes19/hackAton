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

    // Ask for location on load using the new robust function
    handleGpsClick()
  })

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
    <aside class="feed-sidebar">
      <div class="filter-bar">
        {#each categories as cat (cat)}
          <button onclick={() => selectedCategory = cat} class="pill" class:active={selectedCategory === cat}>{cat}</button>
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
        <div class="routing-overlay-panel">
          <h4>Transit to {selectedShop.name}</h4>
          
          {#if userLocation}
            <div class="routing-metrics">
              <div class="metric">
                <span class="lbl">Distance</span>
                <span class="val">{routeDistance !== null && !isNaN(routeDistance) ? `${routeDistance.toFixed(2)} km` : '...'}</span>
              </div>
              <div class="metric">
                <span class="lbl">ETA</span>
                <span class="val" style="color: #49b6ea;">
                  {#if isRouting} ... {:else if routeEta !== null && !isNaN(routeEta)} {routeEta} mins {:else} -- {/if}
                </span>
              </div>
            </div>

            <div class="ride-selector">
              <button class="ride-btn" class:active={travelMode === 'car'} onclick={() => travelMode = 'car'}>🚗 Car</button>
              <button class="ride-btn" class:active={travelMode === 'motorcycle'} onclick={() => travelMode = 'motorcycle'}>🏍️ Moto</button>
              <button class="ride-btn" class:active={travelMode === 'walking'} onclick={() => travelMode = 'walking'}>🚶 Walk</button>
            </div>

            <button 
              class="btn-primary" 
              style="width: 100%; margin-top: 12px; padding: 12px; font-size: 14px; text-align: center; justify-content: center; background: {isNavigating ? '#ef4444' : '#3b82f6'};" 
              onclick={() => { isNavigating = !isNavigating; if (isNavigating) recenterTrigger++; }}
            >
              {isNavigating ? '⏹ Stop Navigation' : '▶ Start Navigation'}
            </button>
          {:else}
            <div style="text-align: center; padding: 0.5rem 0;">
              <p style="font-size: 12px; color: #84b9d5; margin: 0 0 10px 0;">Enable location tracking to start navigation.</p>
              <button class="btn-primary" style="padding: 6px 12px; font-size: 11px;" onclick={handleGpsClick}>Enable GPS Tracking</button>
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
  .feed-sidebar { width: 400px; background: #091525; display: flex; flex-direction: column; border-right: 1px solid rgba(20, 62, 136, 0.6); z-index: 10; flex-shrink: 0; }
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

  .routing-overlay-panel { position: absolute; top: 16px; left: 16px; background: rgba(12, 26, 53, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(73, 182, 234, 0.3); border-radius: 10px; width: 280px; padding: 1rem; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .routing-overlay-panel h4 { margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .routing-metrics { display: flex; justify-content: space-between; background: #091525; padding: 10px; border-radius: 6px; margin-bottom: 12px; border: 1px solid rgba(20, 62, 136, 0.5); }
  .metric { display: flex; flex-direction: column; gap: 2px; }
  .metric .lbl { font-size: 10px; color: #6eb3da; text-transform: uppercase; letter-spacing: 0.03em; }
  .metric .val { font-size: 14px; font-weight: 700; color: #fff; }

  .ride-selector { display: flex; gap: 4px; background: #070f1f; padding: 2px; border-radius: 6px; }
  .ride-btn { flex: 1; background: transparent; border: none; color: #84b9d5; padding: 6px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .ride-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
  .ride-btn.active { background: #3b82f6; color: white; font-weight: 600; }
</style>