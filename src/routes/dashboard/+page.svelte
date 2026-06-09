<script lang="ts">
  import { goto } from '$app/navigation'
  import { supabase } from '$lib/supabase'
  import { getUser } from '$lib/auth'
  import { onMount, tick } from 'svelte'

  interface Product {
    id: string
    name: string
    price: number
    description: string
  }

  interface Shop {
    id: string
    name: string
    category: string
    address: string
    description: string
    lat: number
    lng: number
    products: Product[]
  }

  let shop = $state<Shop | null>(null)
  let loading = $state(true)
  let activeTab = $state<'overview' | 'products' | 'add-product'>('overview')
  let shopName = $state('')
  let shopCategory = $state('Food')
  let shopDesc = $state('')
  let shopAddress = $state('')
  let shopLat = $state(8.1575)
  let shopLng = $state(125.1278)
  let registering = $state(false)
  let registerError = $state('')
  let productName = $state('')
  let productPrice = $state(0)
  let productDesc = $state('')
  let saving = $state(false)
  let message = $state('')
  let pickerMap: unknown = null

  async function registerShop() {
    registering = true
    registerError = ''
    const user = await getUser()
    if (!user) { goto('/login'); return }
    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: shopName, description: shopDesc, category: shopCategory,
        address: shopAddress, lat: shopLat, lng: shopLng, user_id: user.id
      })
    })
    const data = await res.json()
    registering = false
    if (data.error) { registerError = data.error; return }
    shop = { ...data, products: [] }
  }

  onMount(async () => {
    const user = await getUser()
    if (!user) { goto('/login'); return }
    const { data } = await supabase
      .from('shops').select('*, products(*)')
      .eq('user_id', user.id).single()
    shop = data
    loading = false
    await tick()
    initPickerMap()
  })

  async function initPickerMap() {
    const el = document.getElementById('picker-map')
    if (!el || pickerMap) return
    const L = await import('leaflet')
    await import('leaflet/dist/leaflet.css')
    const map = L.map(el).setView([8.1575, 125.1278], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    let marker: ReturnType<typeof L.marker> | null = null
    map.on('click', (e: L.LeafletMouseEvent) => {
      shopLat = parseFloat(e.latlng.lat.toFixed(6))
      shopLng = parseFloat(e.latlng.lng.toFixed(6))
      if (marker) marker.remove()
      marker = L.marker([shopLat, shopLng]).addTo(map)
        .bindPopup('Your shop location').openPopup()
    })
    pickerMap = map
  }

  async function addProduct() {
    if (!shop || !shop.id) return
    saving = true
    message = ''
    const { data, error } = await supabase
      .from('products')
      .insert([{ shop_id: shop.id, name: productName, price: Number(productPrice), description: productDesc }])
      .select()
    saving = false
    if (error) { message = error.message; return }
    shop.products = [...(shop.products ?? []), data[0]]
    productName = ''; productPrice = 0; productDesc = ''
    message = 'Product added!'
    activeTab = 'products'
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    if (shop) shop.products = shop.products.filter(p => p.id !== id)
  }
</script>

<div class="layout">

  <!-- Navbar -->
  <header class="navbar">
    <div class="brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 6l7-4 7 4v8l-7 4-7-4V6z" stroke="#79E0E9" stroke-width="1.5" fill="none"/>
          <path d="M10 2v16M3 6l7 4 7-4" stroke="#49B6EA" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">Budol Map</span>
        <span class="brand-sub">Seller Dashboard</span>
      </div>
    </div>
    <a href="/" class="back-link">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Back to map
    </a>
  </header>

  <div class="content">

    <!-- Loading -->
    {#if loading}
      <div class="loading-state">
        <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(73,182,234,0.2)" stroke-width="2.5"/>
          <path d="M12 3a9 9 0 019 9" stroke="#49b6ea" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span>Loading your shop…</span>
      </div>

    <!-- Register Shop -->
    {:else if !shop}
      <div class="section-label">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4l5-3 5 3v6l-5 3-5-3V4z" stroke="#49b6ea" stroke-width="1.3" fill="none"/>
        </svg>
        New seller
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Become a Seller</h2>
          <p class="card-subtitle">Register your shop to start selling on LocalMarket. Your shop will appear on the map for buyers to discover.</p>
        </div>

        <div class="fields">
          <div class="field">
            <label for="sname">Shop name</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              <input id="sname" bind:value={shopName} placeholder="e.g. Juan's Bakery" />
            </div>
          </div>

          <div class="field">
            <label for="scat">Category</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              <select id="scat" bind:value={shopCategory}>
                <option>Food</option>
                <option>Clothing</option>
                <option>Electronics</option>
                <option>Services</option>
                <option>Health & Beauty</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="sdesc">Description</label>
            <textarea id="sdesc" bind:value={shopDesc} placeholder="What do you sell?" rows="3"></textarea>
          </div>

          <div class="field">
            <label for="saddr">Address</label>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5a5 5 0 015 5c0 3.5-5 8.5-5 8.5S3 10 3 6.5a5 5 0 015-5z" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              <input id="saddr" bind:value={shopAddress} placeholder="e.g. Malaybalay City, Bukidnon" />
            </div>
          </div>

          <div class="field">
            <label>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="display:inline;vertical-align:-1px;margin-right:5px;">
                <path d="M6.5 1a4.5 4.5 0 014.5 4.5C11 8.5 6.5 12 6.5 12S2 8.5 2 5.5A4.5 4.5 0 016.5 1z" stroke="#49b6ea" stroke-width="1.2"/>
                <circle cx="6.5" cy="5.5" r="1.5" stroke="#49b6ea" stroke-width="1.2"/>
              </svg>
              Pin your shop location
            </label>
            <p class="hint">Click anywhere on the map to set your shop's coordinates.</p>
            <div id="picker-map" class="picker-map"></div>
            {#if shopLat && shopLng}
              <p class="location-set">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" fill="rgba(121,224,233,0.15)" stroke="#79e0e9" stroke-width="1.2"/>
                  <path d="M3.5 6l2 2 3-3.5" stroke="#79e0e9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Location set: {shopLat.toFixed(4)}, {shopLng.toFixed(4)}
              </p>
            {/if}
          </div>

          {#if registerError}
            <div class="error-box">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#f87171" stroke-width="1.3"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="#f87171" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              {registerError}
            </div>
          {/if}

          <button class="btn-primary" onclick={registerShop} disabled={registering}>
            {#if registering}
              <svg class="spinner" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <path d="M7.5 2a5.5 5.5 0 015.5 5.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Registering…
            {:else}
              Register my shop
            {/if}
          </button>
        </div>
      </div>

    <!-- Dashboard -->
    {:else}
      <!-- Shop Header Card -->
      <div class="shop-header-card">
        <div class="shop-header-left">
          <div class="shop-avatar">
            {shop.name[0].toUpperCase()}
          </div>
          <div>
            <span class="category-badge">{shop.category}</span>
            <h2 class="shop-name">{shop.name}</h2>
            <p class="shop-meta">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="display:inline;vertical-align:-1px;">
                <path d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7 6 11 6 11S2.5 7 2.5 4.5A3.5 3.5 0 016 1z" stroke="#4d7a9e" stroke-width="1.1"/>
                <circle cx="6" cy="4.5" r="1.2" stroke="#4d7a9e" stroke-width="1.1"/>
              </svg>
              {shop.address}
            </p>
            {#if shop.description}
              <p class="shop-desc">{shop.description}</p>
            {/if}
          </div>
        </div>
        <a href="/shops/{shop.id}" class="view-public-link">
          View public page
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5l7-7M4 2.5h5.5V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        {#each [
          { id: 'overview', label: 'Overview', icon: 'M2 3h10M2 6h10M2 9h6' },
          { id: 'products', label: `Products`, count: shop.products?.length ?? 0 },
          { id: 'add-product', label: 'Add Product', plus: true }
        ] as tab (tab.id)}
          <button
            onclick={() => activeTab = tab.id as typeof activeTab}
            class="tab"
            class:active={activeTab === tab.id}
          >
            {#if tab.plus}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            {/if}
            {tab.label}
            {#if tab.count !== undefined}
              <span class="tab-count">{tab.count}</span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Overview -->
      {#if activeTab === 'overview'}
        <div class="stats-grid">
          {#each [
            { label: 'Total Products', value: shop.products?.length ?? 0, icon: 'M2 3h10M2 6h10M2 9h6', accent: '#49b6ea' },
            { label: 'Category', value: shop.category, icon: 'M1.5 1.5h4v4h-4zM8.5 1.5h4v4h-4zM1.5 8.5h4v4h-4zM8.5 8.5h4v4h-4z', accent: '#79e0e9' },
            { label: 'Location', value: shop.address.split(',')[0], icon: 'M7 1a4 4 0 014 4c0 3-4 7-4 7S3 8 3 5a4 4 0 014-4z', accent: '#84b9d5' }
          ] as stat}
            <div class="stat-card">
              <div class="stat-icon-wrap" style="--accent: {stat.accent}">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d={stat.icon} stroke={stat.accent} stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="stat-value">{stat.value}</div>
              <div class="stat-label">{stat.label}</div>
            </div>
          {/each}
        </div>

      <!-- Products -->
      {:else if activeTab === 'products'}
        {#if !shop.products || shop.products.length === 0}
          <div class="empty-state">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style="opacity:0.3">
              <rect x="4" y="8" width="28" height="22" rx="3" stroke="#84b9d5" stroke-width="1.5"/>
              <path d="M12 8V6a6 6 0 0112 0v2" stroke="#84b9d5" stroke-width="1.5"/>
              <path d="M13 18h10M13 23h6" stroke="#84b9d5" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <p>No products yet.</p>
            <button class="btn-primary" style="margin-top: 0.75rem; width: auto; padding: 8px 20px;" onclick={() => activeTab = 'add-product'}>
              Add your first product
            </button>
          </div>
        {:else}
          <div class="product-list">
            {#each shop.products as product (product.id)}
              <div class="product-card">
                <div class="product-info">
                  <p class="product-name">{product.name}</p>
                  {#if product.description}
                    <p class="product-desc">{product.description}</p>
                  {/if}
                </div>
                <div class="product-actions">
                  <span class="product-price">₱{product.price.toLocaleString()}</span>
                  <button class="btn-delete" onclick={() => deleteProduct(product.id)}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 3.5h9M5 3.5V2.5h3v1M3.5 3.5l.5 7h5l.5-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

      <!-- Add Product -->
      {:else if activeTab === 'add-product'}
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">New product</h2>
            <p class="card-subtitle">Add a product to your shop listing.</p>
          </div>
          <div class="fields">
            <div class="field">
              <label for="pname">Product name</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M5 4V3a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.3"/>
                </svg>
                <input id="pname" bind:value={productName} placeholder="e.g. Bukidnon Pineapple Jam" />
              </div>
            </div>
            <div class="field">
              <label for="pprice">Price (₱)</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M8 5v6M6 6.5h3a1.5 1.5 0 010 3H6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <input id="pprice" type="number" bind:value={productPrice} placeholder="0" />
              </div>
            </div>
            <div class="field">
              <label for="pdesc">Description</label>
              <textarea id="pdesc" bind:value={productDesc} placeholder="Describe the product…" rows="3"></textarea>
            </div>

            {#if message}
              <div class="success-box">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#79e0e9" stroke-width="1.3"/>
                  <path d="M4.5 7l2 2 3-3.5" stroke="#79e0e9" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {message}
              </div>
            {/if}

            <button class="btn-primary" onclick={addProduct} disabled={saving}>
              {#if saving}
                <svg class="spinner" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                  <path d="M7.5 2a5.5 5.5 0 015.5 5.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Saving…
              {:else}
                Add Product
              {/if}
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0; padding: 0;
    background: #070f1f;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }

  .layout {
    min-height: 100vh;
    background: #070f1f;
    background-image:
      radial-gradient(ellipse 60% 40% at 50% 0%, rgba(13,88,176,0.14) 0%, transparent 65%);
    color: #e8f4fc;
  }

  /* ── Navbar ── */
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    height: 56px;
    background: #0c1a35;
    border-bottom: 1px solid rgba(73,182,234,0.15);
    box-shadow: 0 1px 20px rgba(0,0,0,0.4);
    flex-shrink: 0;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-icon {
    width: 34px; height: 34px;
    background: rgba(73,182,234,0.1);
    border: 1px solid rgba(73,182,234,0.25);
    border-radius: 8px;
    display: grid; place-items: center;
  }
  .brand-text { display: flex; flex-direction: column; gap: 1px; }
  .brand-name { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; color: #e8f4fc; line-height: 1; }
  .brand-sub { font-size: 11px; color: #4d7a9e; line-height: 1; }
  .back-link {
    display: flex; align-items: center; gap: 5px;
    font-size: 13px; color: #84b9d5; text-decoration: none;
    padding: 5px 10px; border-radius: 7px;
    border: 1px solid rgba(73,182,234,0.2);
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .back-link:hover { color: #49b6ea; border-color: #49b6ea; background: rgba(73,182,234,0.06); }

  /* ── Content ── */
  .content {
    max-width: 820px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Loading */
  .loading-state {
    display: flex; align-items: center; gap: 10px;
    color: #4d7a9e; font-size: 14px;
    padding: 3rem 0;
    justify-content: center;
  }

  /* Section label */
  .section-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: #49b6ea;
  }

  /* ── Cards ── */
  .card {
    background: #0c1a35;
    border: 1px solid rgba(73,182,234,0.15);
    border-radius: 14px;
    padding: 1.75rem;
    box-shadow: 0 0 0 1px rgba(20,62,136,0.3), 0 16px 40px rgba(0,0,0,0.35);
  }
  .card-header { margin-bottom: 1.5rem; }
  .card-title {
    font-size: 1.25rem; font-weight: 700;
    letter-spacing: -0.02em; color: #e8f4fc;
    margin: 0 0 0.3rem;
  }
  .card-subtitle { font-size: 13.5px; color: #4d7a9e; margin: 0; }

  /* Shop header */
  .shop-header-card {
    background: #0c1a35;
    border: 1px solid rgba(73,182,234,0.15);
    border-radius: 14px;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    box-shadow: 0 0 0 1px rgba(20,62,136,0.3), 0 16px 40px rgba(0,0,0,0.3);
  }
  .shop-header-left { display: flex; align-items: flex-start; gap: 14px; }
  .shop-avatar {
    width: 48px; height: 48px; flex-shrink: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #0d58b0, #49b6ea);
    display: grid; place-items: center;
    font-size: 20px; font-weight: 700; color: white;
    box-shadow: 0 4px 14px rgba(13,88,176,0.4);
  }
  .category-badge {
    display: inline-block;
    font-size: 11px; font-weight: 500;
    padding: 2px 9px; border-radius: 20px;
    background: rgba(73,182,234,0.12);
    border: 1px solid rgba(73,182,234,0.25);
    color: #6eb3da;
    margin-bottom: 5px;
  }
  .shop-name {
    font-size: 1.25rem; font-weight: 700;
    letter-spacing: -0.02em; color: #e8f4fc;
    margin: 0 0 4px;
  }
  .shop-meta { font-size: 12.5px; color: #4d7a9e; margin: 0 0 3px; }
  .shop-desc { font-size: 12.5px; color: #3a6080; margin: 0; }
  .view-public-link {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: #49b6ea; text-decoration: none;
    white-space: nowrap; flex-shrink: 0;
    padding: 5px 10px; border-radius: 7px;
    border: 1px solid rgba(73,182,234,0.25);
    transition: all 0.2s;
  }
  .view-public-link:hover { background: rgba(73,182,234,0.08); border-color: #49b6ea; }

  /* ── Tabs ── */
  .tabs {
    display: flex; gap: 6px;
    border-bottom: 1px solid rgba(20,62,136,0.6);
    padding-bottom: 0;
  }
  .tab {
    display: flex; align-items: center; gap: 5px;
    padding: 8px 16px;
    font-size: 13px; font-weight: 500;
    border: none; border-bottom: 2px solid transparent;
    background: transparent; color: #4d7a9e;
    cursor: pointer; border-radius: 6px 6px 0 0;
    transition: color 0.2s, background 0.2s, border-color 0.2s;
    font-family: inherit;
    margin-bottom: -1px;
  }
  .tab:hover:not(.active) { color: #84b9d5; background: rgba(73,182,234,0.05); }
  .tab.active { color: #49b6ea; border-bottom-color: #49b6ea; background: rgba(73,182,234,0.06); }
  .tab-count {
    font-size: 11px; padding: 1px 6px;
    border-radius: 10px;
    background: rgba(73,182,234,0.12);
    color: #6eb3da;
  }
  .tab.active .tab-count { background: rgba(73,182,234,0.2); color: #49b6ea; }

  /* ── Stats ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .stat-card {
    background: #0c1a35;
    border: 1px solid rgba(73,182,234,0.12);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex; flex-direction: column; gap: 8px;
  }
  .stat-icon-wrap {
    width: 32px; height: 32px;
    background: rgba(73,182,234,0.08);
    border: 1px solid rgba(73,182,234,0.15);
    border-radius: 8px;
    display: grid; place-items: center;
  }
  .stat-value { font-size: 1.4rem; font-weight: 700; color: #e8f4fc; letter-spacing: -0.02em; }
  .stat-label { font-size: 12px; color: #4d7a9e; }

  /* ── Products ── */
  .product-list { display: flex; flex-direction: column; gap: 8px; }
  .product-card {
    background: #0c1a35;
    border: 1px solid rgba(73,182,234,0.12);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    display: flex; justify-content: space-between; align-items: center;
    gap: 1rem;
    transition: border-color 0.2s;
  }
  .product-card:hover { border-color: rgba(73,182,234,0.25); }
  .product-info { flex: 1; min-width: 0; }
  .product-name { font-size: 14px; font-weight: 600; color: #e8f4fc; margin: 0 0 2px; }
  .product-desc { font-size: 12px; color: #3a6080; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .product-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .product-price { font-size: 15px; font-weight: 700; color: #49b6ea; }
  .btn-delete {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; padding: 5px 10px;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 6px; color: #f87171;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  .btn-delete:hover { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.4); }

  /* Empty state */
  .empty-state {
    background: #0c1a35;
    border: 1px dashed rgba(73,182,234,0.2);
    border-radius: 12px;
    padding: 3rem;
    text-align: center;
    color: #3a6080;
    font-size: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }

  /* ── Fields / Inputs (shared with login/register) ── */
  .fields { display: flex; flex-direction: column; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  label {
    font-size: 12.5px; font-weight: 500;
    letter-spacing: 0.02em; color: #6eb3da;
    text-transform: uppercase;
  }
  .input-wrap { position: relative; }
  .input-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: #2d5580; pointer-events: none; transition: color 0.2s;
  }
  .input-wrap:focus-within .input-icon { color: #49b6ea; }
  input, select, textarea {
    width: 100%;
    padding: 10px 12px 10px 36px;
    background: #091525;
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }
  select { appearance: none; cursor: pointer; }
  textarea { padding: 10px 12px; resize: vertical; min-height: 80px; }
  input::placeholder, textarea::placeholder { color: #2d5580; }
  input:focus, select:focus, textarea:focus {
    border-color: #49b6ea;
    box-shadow: 0 0 0 3px rgba(121,224,233,0.1), 0 0 14px rgba(73,182,234,0.08);
  }

  .hint { font-size: 12px; color: #2d5580; margin: 0 0 8px; }
  .location-set {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #79e0e9; margin: 6px 0 0;
  }

  /* Map picker */
  .picker-map {
    height: 260px;
    border-radius: 10px;
    border: 1px solid #143e88;
    overflow: hidden;
  }

  /* Alerts */
  .error-box {
    display: flex; align-items: center; gap: 8px;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 8px; padding: 10px 12px;
    color: #f87171; font-size: 13px;
  }
  .success-box {
    display: flex; align-items: center; gap: 8px;
    background: rgba(121,224,233,0.07);
    border: 1px solid rgba(121,224,233,0.2);
    border-radius: 8px; padding: 10px 12px;
    color: #79e0e9; font-size: 13px;
  }

  /* Button */
  .btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    width: 100%; padding: 11px;
    background: linear-gradient(135deg, #0d58b0 0%, #49b6ea 100%);
    border: none; border-radius: 8px;
    color: #fff; font-size: 14.5px; font-weight: 600;
    letter-spacing: 0.01em; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    font-family: inherit;
    box-shadow: 0 4px 18px rgba(13,88,176,0.4);
  }
  .btn-primary:hover:not(:disabled) {
    opacity: 0.9; transform: translateY(-1px);
    box-shadow: 0 6px 26px rgba(73,182,234,0.35);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Spinner */
  .spinner { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .shop-header-card { flex-direction: column; }
    .shop-header-left { flex-direction: column; }
  }
</style>