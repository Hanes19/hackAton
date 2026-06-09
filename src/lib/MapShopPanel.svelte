<script lang="ts">
  import {
    type MapShop,
    type MapProduct,
    type CartItem,
    shopRating,
    shopReviewCount,
    priceRange,
    shopThumbnail,
    isOpenNow,
    fetchShopDetail,
    placeOrder
  } from '$lib/mapShop'

  interface Props {
    shops: MapShop[]
    filtered: MapShop[]
    search: string
    selectedCategory: string
    categories: string[]
    focusedShopId: string | null
    userLocation: { lat: number; lng: number } | null
    routeEta: number | null
    routeDistance: number | null
    isRouting: boolean
    travelMode: 'walking' | 'motorcycle' | 'car'
    isNavigating: boolean
    onCategoryChange: (cat: string) => void
    onSelectShop: (id: string | null) => void
    onGpsClick: () => void
    onToggleNav: () => void
    onTravelModeChange: (mode: 'walking' | 'motorcycle' | 'car') => void
  }

  let {
    shops,
    filtered,
    search = $bindable(),
    selectedCategory,
    categories,
    focusedShopId = $bindable(),
    userLocation,
    routeEta,
    routeDistance,
    isRouting,
    travelMode,
    isNavigating,
    onCategoryChange,
    onSelectShop,
    onGpsClick,
    onToggleNav,
    onTravelModeChange
  }: Props = $props()

  type Tab = 'overview' | 'menu' | 'order'
  let activeTab = $state<Tab>('overview')
  let detailShop = $state<MapShop | null>(null)
  let detailLoading = $state(false)
  let cart = $state<CartItem[]>([])
  let customerNote = $state('')
  let ordering = $state(false)
  let orderSuccess = $state(false)
  let orderError = $state('')

  let selectedListShop = $derived(shops.find((s) => s.id === focusedShopId) ?? null)
  let displayShop = $derived(detailShop ?? selectedListShop)
  let cartTotal = $derived(cart.reduce((sum, i) => sum + i.price * i.quantity, 0))
  let cartCount = $derived(cart.reduce((sum, i) => sum + i.quantity, 0))

  $effect(() => {
    if (!focusedShopId) {
      detailShop = null
      activeTab = 'overview'
      orderSuccess = false
      orderError = ''
      return
    }
    loadDetail(focusedShopId)
  })

  async function loadDetail(id: string) {
    detailLoading = true
    orderError = ''
    try {
      detailShop = await fetchShopDetail(id)
    } catch {
      detailShop = selectedListShop
    } finally {
      detailLoading = false
    }
  }

  function stars(rating: number): string {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  }

  function snippet(text: string): string {
    if (!text) return '"Great local spot — worth a visit."'
    const t = text.trim()
    if (t.length <= 60) return `"${t}"`
    return `"${t.slice(0, 57)}…"`
  }

  function addToCart(product: MapProduct) {
    const existing = cart.find((c) => c.productId === product.id)
    if (existing) {
      existing.quantity += 1
      cart = [...cart]
    } else {
      cart = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          image: product.image_data
        }
      ]
    }
    activeTab = 'order'
  }

  function updateQty(productId: string, delta: number) {
    cart = cart
      .map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + delta } : c))
      .filter((c) => c.quantity > 0)
  }

  async function submitOrder() {
    if (!displayShop || !cart.length) return
    ordering = true
    orderError = ''
    try {
      await placeOrder({
        shop_id: displayShop.id,
        shop_name: displayShop.name,
        items: cart,
        total: cartTotal,
        customer_note: customerNote
      })
      orderSuccess = true
      cart = []
      customerNote = ''
    } catch (e) {
      orderError = e instanceof Error ? e.message : 'Could not place order'
    } finally {
      ordering = false
    }
  }

  function backToList() {
    onSelectShop(null)
    focusedShopId = null
  }
</script>

<aside class="map-shop-panel" class:nav-hidden={isNavigating}>
  {#if !focusedShopId}
  <div class="panel-search">
    <span class="search-icon">🔍</span>
    <input bind:value={search} placeholder="Search shops, products, categories…" class="search-field" />
    {#if search}
      <button type="button" class="clear-btn" onclick={() => (search = '')} aria-label="Clear search">×</button>
    {/if}
  </div>

  <div class="results-header">
    <h2>Results</h2>
    <span class="results-count">{filtered.length} places</span>
  </div>

  <div class="category-scroll">
    {#each categories as cat (cat)}
      <button
        type="button"
        class="cat-pill"
        class:active={selectedCategory === cat}
        onclick={() => onCategoryChange(cat)}
      >
        {cat}
      </button>
    {/each}
  </div>

  <div class="results-list">
    {#each filtered as shop (shop.id)}
      {@const rating = shopRating(shop.id)}
      {@const reviews = shopReviewCount(shop.id)}
      {@const open = isOpenNow(shop.id)}
      <button
        type="button"
        class="result-card"
        class:selected={focusedShopId === shop.id}
        onclick={() => onSelectShop(shop.id)}
      >
        <div class="result-body">
          <h3 class="result-name">{shop.name}</h3>
          <div class="result-rating">
            <span class="rating-num">{rating.toFixed(1)}</span>
            <span class="rating-stars">{stars(rating)}</span>
            <span class="review-count">({reviews})</span>
          </div>
          <p class="result-meta">
            <span class="price-range">{priceRange(shop.products)}</span>
            <span class="dot">·</span>
            <span>{shop.category}</span>
          </p>
          <p class="result-address">{shop.address || 'Bukidnon'}</p>
          <p class="result-status" class:open>
            {open ? 'Open now' : 'Closed'}
            {#if !open} · Opens {String(shop.id).charCodeAt(0) % 2 === 0 ? '8' : '10'} AM{/if}
          </p>
          <p class="result-snippet">
            <span class="avatar">👤</span>
            {snippet(shop.description)}
          </p>
          {#if shop.products?.length}
            <span class="order-hint">Order · {shop.products.length} item{shop.products.length === 1 ? '' : 's'}</span>
          {/if}
        </div>
        <img src={shopThumbnail(shop)} alt="" class="result-thumb" />
      </button>
    {:else}
      <p class="empty">No shops match your search.</p>
    {/each}
  </div>

  <label class="map-sync">
    <input type="checkbox" checked disabled />
    Update results when map moves
  </label>

  {:else if displayShop}
  <div class="detail-view">
    <button type="button" class="back-btn" onclick={backToList}>← Results</button>

    {#if detailLoading}
      <p class="loading">Loading shop…</p>
    {:else}
      <div class="hero-wrap">
        <img
          src={shopThumbnail(displayShop)}
          alt=""
          class="hero-img"
        />
      </div>

      <div class="detail-head">
        <h2>{displayShop.name}</h2>
        <div class="result-rating">
          <span class="rating-num">{shopRating(displayShop.id).toFixed(1)}</span>
          <span class="rating-stars">{stars(shopRating(displayShop.id))}</span>
          <span class="review-count">({shopReviewCount(displayShop.id)})</span>
        </div>
        <p class="result-meta">
          <span class="price-range">{priceRange(displayShop.products)}</span>
          <span class="dot">·</span>
          <span>{displayShop.category}</span>
          {#if displayShop.business_type}
            <span class="dot">·</span>
            <span>{displayShop.business_type === 'service' ? 'Services' : 'Products'}</span>
          {/if}
        </p>
      </div>

      <div class="action-row">
        <button type="button" class="action-chip" onclick={onGpsClick} title="Get directions">
          <span class="chip-icon">🧭</span>
          <span>Directions</span>
        </button>
        <button type="button" class="action-chip" onclick={() => (activeTab = 'menu')}>
          <span class="chip-icon">🛒</span>
          <span>Order</span>
        </button>
        <button type="button" class="action-chip" onclick={() => (activeTab = 'order')} class:has-badge={cartCount > 0}>
          <span class="chip-icon">🧾</span>
          <span>Cart</span>
          {#if cartCount > 0}<span class="badge">{cartCount}</span>{/if}
        </button>
        <a href="/shops/{displayShop.id}" class="action-chip link">
          <span class="chip-icon">↗</span>
          <span>Full page</span>
        </a>
      </div>

      {#if userLocation}
        <div class="route-bar">
          <div class="route-stats">
            <span class="eta">
              {#if isRouting}…{:else if routeEta != null}{routeEta} min{:else}—{/if}
            </span>
            <span class="dist">
              {routeDistance != null ? `${routeDistance.toFixed(1)} km` : ''}
            </span>
          </div>
          <div class="mode-picker">
            <button type="button" class:active={travelMode === 'car'} onclick={() => onTravelModeChange('car')}>🚗</button>
            <button type="button" class:active={travelMode === 'motorcycle'} onclick={() => onTravelModeChange('motorcycle')}>🏍️</button>
            <button type="button" class:active={travelMode === 'walking'} onclick={() => onTravelModeChange('walking')}>🚶</button>
          </div>
          <button type="button" class="nav-btn" class:stop={isNavigating} onclick={onToggleNav}>
            {isNavigating ? 'End route' : 'Start navigation'}
          </button>
        </div>
      {:else}
        <button type="button" class="gps-prompt" onclick={onGpsClick}>Enable location for directions</button>
      {/if}

      <div class="tabs">
        <button type="button" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>Overview</button>
        <button type="button" class:active={activeTab === 'menu'} onclick={() => (activeTab = 'menu')}>
          {displayShop.business_type === 'service' ? 'Services' : 'Menu'}
        </button>
        <button type="button" class:active={activeTab === 'order'} onclick={() => (activeTab = 'order')}>
          Order {#if cartCount > 0}({cartCount}){/if}
        </button>
      </div>

      <div class="tab-content">
        {#if activeTab === 'overview'}
          <div class="overview">
            <div class="info-row"><span>📍</span><span>{displayShop.address || 'Bukidnon, Philippines'}</span></div>
            <div class="info-row">
              <span>🕐</span>
              <span class:open={isOpenNow(displayShop.id)}>
                {isOpenNow(displayShop.id) ? 'Open now' : 'Closed'}
              </span>
            </div>
            <div class="info-row"><span>💰</span><span>{priceRange(displayShop.products)} per item</span></div>
            <p class="about">{displayShop.description || 'A local business on Budol Map.'}</p>
            <div class="services">
              <span class="svc">✓ {displayShop.business_type === 'service' ? 'Book service' : 'Pickup'}</span>
              <span class="svc">✓ Delivery (local)</span>
              <span class="svc">✓ Dine-in / visit</span>
            </div>
          </div>
        {:else if activeTab === 'menu'}
          <div class="menu-list">
            {#if displayShop.products?.length}
              {#each displayShop.products as product (product.id)}
                <article class="menu-item">
                  {#if product.image_data}
                    <img src={product.image_data} alt="" class="menu-thumb" />
                  {:else}
                    <div class="menu-thumb placeholder">{displayShop.business_type === 'service' ? '🛠' : '🍽'}</div>
                  {/if}
                  <div class="menu-info">
                    <h4>{product.name}</h4>
                    {#if product.highlights}<span class="highlight">{product.highlights}</span>{/if}
                    {#if product.subcategory}<span class="sub">{product.subcategory}</span>{/if}
                    <p class="menu-price">₱{Number(product.price).toLocaleString()}</p>
                  </div>
                  <button type="button" class="add-btn" onclick={() => addToCart(product)}>Add</button>
                </article>
              {/each}
            {:else}
              <p class="empty">No items listed yet. Check back soon.</p>
            {/if}
          </div>
        {:else}
          <div class="order-panel">
            {#if orderSuccess}
              <div class="success-box">
                <p>✓ Order placed!</p>
                <p class="muted">The shop will confirm your order shortly.</p>
                <button type="button" class="secondary" onclick={() => (orderSuccess = false)}>Order more</button>
              </div>
            {:else if !cart.length}
              <p class="empty">Your cart is empty. Browse the menu to add items.</p>
              <button type="button" class="secondary" onclick={() => (activeTab = 'menu')}>View menu</button>
            {:else}
              <ul class="cart-list">
                {#each cart as item (item.productId)}
                  <li class="cart-row">
                    <div class="cart-name">{item.name}</div>
                    <div class="cart-controls">
                      <button type="button" onclick={() => updateQty(item.productId, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onclick={() => updateQty(item.productId, 1)}>+</button>
                    </div>
                    <span class="cart-line">₱{(item.price * item.quantity).toLocaleString()}</span>
                  </li>
                {/each}
              </ul>
              <label class="note-label">
                Note for shop (optional)
                <textarea bind:value={customerNote} rows="2" placeholder="e.g. less spicy, call when ready"></textarea>
              </label>
              <div class="order-total">
                <span>Total</span>
                <strong>₱{cartTotal.toLocaleString()}</strong>
              </div>
              {#if orderError}<p class="error">{orderError}</p>{/if}
              <button type="button" class="place-order" disabled={ordering} onclick={submitOrder}>
                {ordering ? 'Placing order…' : 'Place order'}
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
  {/if}
</aside>

<style>
  .map-shop-panel {
    width: 408px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #fff;
    color: #202124;
    border-right: 1px solid #e0e0e0;
    z-index: 10;
    transition: margin-left 0.35s ease, opacity 0.25s;
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  }

  .map-shop-panel.nav-hidden {
    margin-left: -408px;
    opacity: 0;
    pointer-events: none;
  }

  .panel-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #e8eaed;
  }

  .search-icon { font-size: 14px; opacity: 0.5; }
  .search-field {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    color: #202124;
    background: transparent;
  }

  .clear-btn {
    border: none;
    background: #f1f3f4;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    color: #5f6368;
  }

  .results-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 12px 16px 4px;
  }

  .results-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }

  .results-count { font-size: 13px; color: #5f6368; }

  .category-scroll {
    display: flex;
    gap: 8px;
    padding: 8px 16px 12px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid #e8eaed;
  }

  .category-scroll::-webkit-scrollbar { display: none; }

  .cat-pill {
    border: 1px solid #dadce0;
    background: #fff;
    color: #3c4043;
    padding: 6px 14px;
    border-radius: 18px;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
  }

  .cat-pill.active {
    background: #e8f0fe;
    border-color: #1a73e8;
    color: #1a73e8;
  }

  .results-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .result-card {
    display: flex;
    gap: 12px;
    width: 100%;
    text-align: left;
    padding: 14px 16px;
    border: none;
    border-bottom: 1px solid #e8eaed;
    background: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .result-card:hover { background: #f8f9fa; }
  .result-card.selected { background: #e8f0fe; }

  .result-body { flex: 1; min-width: 0; }

  .result-name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 500;
    color: #202124;
  }

  .result-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    margin-bottom: 2px;
  }

  .rating-num { font-weight: 600; color: #202124; }
  .rating-stars { color: #f9ab00; letter-spacing: -1px; }
  .review-count { color: #5f6368; }

  .result-meta {
    margin: 0 0 2px;
    font-size: 13px;
    color: #5f6368;
  }

  .dot { margin: 0 4px; }

  .result-address {
    margin: 0 0 4px;
    font-size: 13px;
    color: #5f6368;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-status {
    margin: 0 0 6px;
    font-size: 13px;
    color: #d93025;
  }

  .result-status.open { color: #188038; }

  .result-snippet {
    margin: 0;
    font-size: 12px;
    color: #5f6368;
    display: flex;
    gap: 6px;
    align-items: flex-start;
    line-height: 1.4;
  }

  .avatar { flex-shrink: 0; font-size: 14px; }

  .order-hint {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #1a73e8;
  }

  .result-thumb {
    width: 88px;
    height: 88px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
    background: #f1f3f4;
  }

  .map-sync {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 12px;
    color: #5f6368;
    border-top: 1px solid #e8eaed;
    background: #f8f9fa;
  }

  .empty, .loading {
    padding: 24px 16px;
    color: #5f6368;
    font-size: 14px;
    text-align: center;
  }

  /* Detail view */
  .detail-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .back-btn {
    align-self: flex-start;
    margin: 12px 16px 0;
    border: none;
    background: none;
    color: #1a73e8;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 0;
  }

  .hero-wrap { padding: 8px 16px 0; }
  .hero-img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 12px;
    background: #f1f3f4;
  }

  .detail-head { padding: 12px 16px 0; }
  .detail-head h2 {
    margin: 0 0 6px;
    font-size: 20px;
    font-weight: 500;
  }

  .action-row {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .action-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 64px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 11px;
    color: #1a73e8;
    text-decoration: none;
    position: relative;
  }

  .chip-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e8f0fe;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .action-chip.has-badge .chip-icon { background: #fce8e6; }

  .badge {
    position: absolute;
    top: 0;
    right: 8px;
    background: #d93025;
    color: #fff;
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  .route-bar {
    margin: 0 16px 8px;
    padding: 10px 12px;
    background: #f8f9fa;
    border-radius: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .route-stats { display: flex; align-items: baseline; gap: 8px; }
  .eta { font-size: 18px; font-weight: 700; color: #1a73e8; }
  .dist { font-size: 13px; color: #5f6368; }

  .mode-picker {
    display: flex;
    gap: 2px;
    background: #fff;
    border-radius: 6px;
    padding: 2px;
    margin-left: auto;
  }

  .mode-picker button {
    border: none;
    background: transparent;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .mode-picker button.active { background: #1a73e8; }

  .nav-btn {
    width: 100%;
    margin-top: 4px;
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: #1a73e8;
    color: #fff;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }

  .nav-btn.stop { background: #d93025; }

  .gps-prompt {
    margin: 0 16px 8px;
    padding: 10px;
    width: calc(100% - 32px);
    border: 1px dashed #dadce0;
    border-radius: 8px;
    background: #f8f9fa;
    color: #1a73e8;
    font-size: 13px;
    cursor: pointer;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #e8eaed;
    padding: 0 16px;
    flex-shrink: 0;
  }

  .tabs button {
    flex: 1;
    padding: 12px 8px;
    border: none;
    background: none;
    font-size: 13px;
    font-weight: 500;
    color: #5f6368;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tabs button.active {
    color: #1a73e8;
    border-bottom-color: #1a73e8;
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .overview .info-row {
    display: flex;
    gap: 10px;
    font-size: 14px;
    margin-bottom: 10px;
    color: #3c4043;
  }

  .overview .info-row .open { color: #188038; font-weight: 500; }

  .about {
    margin: 16px 0;
    font-size: 14px;
    line-height: 1.5;
    color: #5f6368;
  }

  .services {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: #188038;
  }

  .menu-list { display: flex; flex-direction: column; gap: 12px; }

  .menu-item {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8eaed;
  }

  .menu-thumb {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .menu-thumb.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f3f4;
    font-size: 24px;
  }

  .menu-info { flex: 1; min-width: 0; }
  .menu-info h4 { margin: 0 0 4px; font-size: 14px; font-weight: 500; }
  .highlight { font-size: 11px; color: #b06000; display: block; }
  .sub { font-size: 11px; color: #5f6368; }
  .menu-price { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #202124; }

  .add-btn {
    border: 1px solid #1a73e8;
    background: #fff;
    color: #1a73e8;
    padding: 6px 14px;
    border-radius: 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
  }

  .add-btn:hover { background: #e8f0fe; }

  .cart-list { list-style: none; margin: 0 0 16px; padding: 0; }
  .cart-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e8eaed;
    font-size: 14px;
  }

  .cart-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cart-controls button {
    width: 28px;
    height: 28px;
    border: 1px solid #dadce0;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    font-size: 16px;
  }

  .cart-line { font-weight: 600; min-width: 70px; text-align: right; }

  .note-label {
    display: block;
    font-size: 13px;
    color: #5f6368;
    margin-bottom: 12px;
  }

  .note-label textarea {
    width: 100%;
    margin-top: 6px;
    padding: 8px;
    border: 1px solid #dadce0;
    border-radius: 8px;
    font-family: inherit;
    font-size: 13px;
    box-sizing: border-box;
    resize: vertical;
  }

  .order-total {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    margin-bottom: 12px;
    padding-top: 8px;
    border-top: 1px solid #e8eaed;
  }

  .place-order {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 8px;
    background: #1a73e8;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }

  .place-order:disabled { opacity: 0.6; cursor: wait; }

  .secondary {
    width: 100%;
    padding: 10px;
    border: 1px solid #dadce0;
    border-radius: 8px;
    background: #fff;
    color: #1a73e8;
    font-weight: 500;
    cursor: pointer;
    margin-top: 8px;
  }

  .success-box {
    text-align: center;
    padding: 24px 12px;
    background: #e6f4ea;
    border-radius: 12px;
    color: #137333;
  }

  .success-box p { margin: 0 0 8px; font-weight: 600; }
  .success-box .muted { font-weight: 400; font-size: 13px; color: #5f6368; }

  .error { color: #d93025; font-size: 13px; margin: 0 0 8px; }
</style>