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
    hasFlashDeal,
    fetchShopDetail,
    placeOrder
  } from '$lib/mapShop'
  import type { TravelMode } from '$lib/mapExplorer'

  interface Props {
    shopId: string
    listShop: MapShop | null
    embedded?: boolean
    userLocation: { lat: number; lng: number } | null
    routeEta: number | null
    routeDistance: number | null
    isRouting: boolean
    travelMode: TravelMode
    isNavigating: boolean
    onBack: () => void
    onGpsClick: () => void
    onToggleNav: () => void
    onTravelModeChange: (mode: TravelMode) => void
  }

  let {
    shopId,
    listShop,
    embedded = false,
    userLocation,
    routeEta,
    routeDistance,
    isRouting,
    travelMode,
    isNavigating,
    onBack,
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

  let displayShop = $derived(detailShop ?? listShop)
  let cartTotal = $derived(cart.reduce((sum, i) => sum + i.price * i.quantity, 0))
  let cartCount = $derived(cart.reduce((sum, i) => sum + i.quantity, 0))
  let isOpen = $derived(displayShop ? isOpenNow(displayShop.id) : false)
  let flashDeal = $derived(displayShop ? hasFlashDeal(displayShop.id) : false)

  $effect(() => {
    void shopId
    activeTab = 'overview'
    orderSuccess = false
    orderError = ''
    loadDetail(shopId)
  })

  async function loadDetail(id: string) {
    detailLoading = true
    orderError = ''
    try {
      detailShop = await fetchShopDetail(id)
    } catch {
      detailShop = listShop
    } finally {
      detailLoading = false
    }
  }

  function stars(rating: number): string {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
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
</script>

<div class="detail-view" class:embedded>
  {#if detailLoading}
    <div class="state-screen">
      <span class="spinner" aria-hidden="true"></span>
      <p>Loading shop…</p>
    </div>
  {:else if displayShop}
    <div class="cover">
      <img src={shopThumbnail(displayShop)} alt="" class="cover-img" />
      <div class="cover-shade"></div>
      {#if flashDeal}
        <span class="deal-badge">Flash deal</span>
      {/if}
      {#if embedded}
        <button type="button" class="cover-close" onclick={onBack} aria-label="Close">×</button>
      {:else}
        <button type="button" class="cover-close back" onclick={onBack} aria-label="Back">←</button>
      {/if}
    </div>

    <div class="identity">
      <div class="identity-top">
        <div class="tags">
          <span class="tag category">{displayShop.category}</span>
          {#if displayShop.business_type}
            <span class="tag muted">
              {displayShop.business_type === 'service' ? 'Services' : 'Products'}
            </span>
          {/if}
        </div>
        <span class="status-pill" class:open={isOpen}>{isOpen ? 'Open now' : 'Closed'}</span>
      </div>
      <h2>{displayShop.name}</h2>
      <div class="meta-row">
        <span class="rating-num">{shopRating(displayShop.id).toFixed(1)}</span>
        <span class="stars">{stars(shopRating(displayShop.id))}</span>
        <span class="reviews">({shopReviewCount(displayShop.id)} reviews)</span>
      </div>
      <p class="address-line">📍 {displayShop.address || 'Bukidnon, Philippines'}</p>
    </div>

    <div class="action-bar">
      <button type="button" class="action primary" onclick={onGpsClick}>
        <span class="action-ico">🧭</span>
        Directions
      </button>
      <button type="button" class="action" onclick={() => (activeTab = 'menu')}>
        <span class="action-ico">🛒</span>
        Menu
      </button>
      <button type="button" class="action" class:has-cart={cartCount > 0} onclick={() => (activeTab = 'order')}>
        <span class="action-ico">🧾</span>
        Cart
        {#if cartCount > 0}<span class="cart-dot">{cartCount}</span>{/if}
      </button>
      <a href="/shops/{displayShop.id}" class="action link">
        <span class="action-ico">↗</span>
        Page
      </a>
    </div>

    {#if userLocation}
      <div class="route-strip">
        <div class="route-metrics">
          <div class="metric">
            <span class="metric-label">ETA</span>
            <strong>
              {#if isRouting}…{:else if routeEta != null}{routeEta} min{:else}—{/if}
            </strong>
          </div>
          <div class="metric-divider"></div>
          <div class="metric">
            <span class="metric-label">Distance</span>
            <strong>{routeDistance != null ? `${routeDistance.toFixed(1)} km` : '—'}</strong>
          </div>
        </div>
        <div class="mode-row">
          <div class="mode-picker">
            <button type="button" class:active={travelMode === 'car'} onclick={() => onTravelModeChange('car')}>🚗</button>
            <button type="button" class:active={travelMode === 'motorcycle'} onclick={() => onTravelModeChange('motorcycle')}>🏍️</button>
            <button type="button" class:active={travelMode === 'walking'} onclick={() => onTravelModeChange('walking')}>🚶</button>
          </div>
          <button type="button" class="nav-cta" class:stop={isNavigating} onclick={onToggleNav}>
            {isNavigating ? 'End' : 'Navigate'}
          </button>
        </div>
      </div>
    {:else}
      <button type="button" class="loc-cta" onclick={onGpsClick}>
        Enable location for directions
      </button>
    {/if}

    <div class="seg-tabs" role="tablist">
      <button type="button" role="tab" class:active={activeTab === 'overview'} onclick={() => (activeTab = 'overview')}>
        Overview
      </button>
      <button type="button" role="tab" class:active={activeTab === 'menu'} onclick={() => (activeTab = 'menu')}>
        {displayShop.business_type === 'service' ? 'Services' : 'Menu'}
      </button>
      <button type="button" role="tab" class:active={activeTab === 'order'} onclick={() => (activeTab = 'order')}>
        Order{#if cartCount > 0}<span class="tab-count">{cartCount}</span>{/if}
      </button>
    </div>

    <div class="scroll-body">
      {#if activeTab === 'overview'}
        <div class="overview-grid">
          <div class="stat-tile">
            <span class="tile-label">Price range</span>
            <strong>{priceRange(displayShop.products)}</strong>
          </div>
          <div class="stat-tile">
            <span class="tile-label">Listings</span>
            <strong>{displayShop.products?.length ?? 0} items</strong>
          </div>
        </div>
        <p class="about">{displayShop.description || 'A local business on Budol Map.'}</p>
        <div class="chips">
          <span class="chip">✓ Pickup</span>
          <span class="chip">✓ Local delivery</span>
          <span class="chip">✓ Visit in person</span>
        </div>
      {:else if activeTab === 'menu'}
        {#if displayShop.products?.length}
          <div class="menu-grid">
            {#each displayShop.products as product (product.id)}
              <article class="menu-card">
                {#if product.image_data}
                  <img src={product.image_data} alt="" class="menu-img" />
                {:else}
                  <div class="menu-img placeholder">{displayShop.business_type === 'service' ? '🛠' : '🍽'}</div>
                {/if}
                <div class="menu-content">
                  <div class="menu-head">
                    <h4>{product.name}</h4>
                    <span class="menu-price">₱{Number(product.price).toLocaleString()}</span>
                  </div>
                  {#if product.subcategory}<span class="menu-tag">{product.subcategory}</span>{/if}
                  {#if product.highlights}<span class="menu-highlight">{product.highlights}</span>{/if}
                  <button type="button" class="add-cta" onclick={() => addToCart(product)}>Add to cart</button>
                </div>
              </article>
            {/each}
          </div>
        {:else}
          <p class="empty">No items listed yet.</p>
        {/if}
      {:else}
        {#if orderSuccess}
          <div class="success-card">
            <span class="success-icon">✓</span>
            <h3>Order placed!</h3>
            <p>The shop will confirm shortly.</p>
            <button type="button" class="ghost-btn" onclick={() => (orderSuccess = false)}>Order more</button>
          </div>
        {:else if !cart.length}
          <div class="empty-cart">
            <span class="empty-icon">🛒</span>
            <p>Your cart is empty</p>
            <button type="button" class="ghost-btn" onclick={() => (activeTab = 'menu')}>Browse menu</button>
          </div>
        {:else}
          <ul class="cart-list">
            {#each cart as item (item.productId)}
              <li class="cart-item">
                <div class="cart-info">
                  <strong>{item.name}</strong>
                  <span>₱{item.price.toLocaleString()} each</span>
                </div>
                <div class="qty-stepper">
                  <button type="button" onclick={() => updateQty(item.productId, -1)} aria-label="Decrease">−</button>
                  <span>{item.quantity}</span>
                  <button type="button" onclick={() => updateQty(item.productId, 1)} aria-label="Increase">+</button>
                </div>
                <strong class="line-total">₱{(item.price * item.quantity).toLocaleString()}</strong>
              </li>
            {/each}
          </ul>
          <label class="note-field">
            Note for shop
            <textarea bind:value={customerNote} rows="2" placeholder="Optional instructions…"></textarea>
          </label>
          {#if orderError}<p class="error">{orderError}</p>{/if}
        {/if}
      {/if}
    </div>

    {#if activeTab === 'order' && cart.length && !orderSuccess}
      <footer class="checkout-bar">
        <div class="checkout-total">
          <span>Total</span>
          <strong>₱{cartTotal.toLocaleString()}</strong>
        </div>
        <button type="button" class="checkout-btn" disabled={ordering} onclick={submitOrder}>
          {ordering ? 'Placing…' : 'Place order'}
        </button>
      </footer>
    {/if}
  {/if}
</div>

<style>
  .detail-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--bg-card);
    color: var(--text-dark);
  }

  .state-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--border);
    border-top-color: var(--budol-orange);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .cover {
    position: relative;
    height: 112px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .cover-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.45) 100%);
  }

  .deal-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: var(--alert-red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
  }

  .cover-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: var(--text-dark);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }

  .cover-close.back {
    font-size: 16px;
    font-weight: 700;
  }

  .identity {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .identity-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 4px 9px;
    border-radius: var(--radius-pill);
  }

  .tag.category {
    background: var(--primary-light);
    color: var(--budol-orange);
  }

  .tag.muted {
    background: var(--bg);
    color: var(--text-muted);
  }

  .status-pill {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: rgba(244, 67, 54, 0.1);
    color: var(--alert-red);
    flex-shrink: 0;
  }

  .status-pill.open {
    background: var(--success-bg);
    color: var(--success);
  }

  .identity h2 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .rating-num {
    font-weight: 800;
    color: var(--text-dark);
  }

  .stars {
    color: #f5a623;
    letter-spacing: -1px;
  }

  .reviews {
    color: var(--text-muted);
  }

  .address-line {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action-bar {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    overflow-x: auto;
    scrollbar-width: none;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }

  .action-bar::-webkit-scrollbar {
    display: none;
  }

  .action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border-strong);
    background: var(--bg-card);
    color: var(--text-dark);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
    position: relative;
    transition: all 0.15s ease;
  }

  .action:hover {
    border-color: var(--budol-orange);
    color: var(--budol-orange);
  }

  .action.primary {
    background: var(--budol-orange);
    border-color: var(--budol-orange);
    color: var(--text-inverse);
  }

  .action.primary:hover {
    background: var(--budol-orange-hover);
    border-color: var(--budol-orange-hover);
    color: var(--text-inverse);
  }

  .action-ico {
    font-size: 14px;
    line-height: 1;
  }

  .cart-dot {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--alert-red);
    color: white;
    font-size: 9px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .route-strip {
    margin: 0 16px 12px;
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  .route-metrics {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 10px;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .metric-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .metric strong {
    font-size: 18px;
    color: var(--budol-orange);
  }

  .metric-divider {
    width: 1px;
    height: 28px;
    background: var(--border);
  }

  .mode-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .mode-picker {
    display: flex;
    gap: 4px;
    padding: 3px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .mode-picker button {
    border: none;
    background: transparent;
    color: var(--text-muted);
    padding: 5px 9px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .mode-picker button.active {
    background: var(--budol-orange);
    color: white;
  }

  .nav-cta {
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--budol-orange);
    color: white;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .nav-cta.stop {
    background: var(--alert-red);
  }

  .loc-cta {
    margin: 0 16px 12px;
    padding: 11px;
    width: calc(100% - 32px);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg);
    color: var(--budol-orange);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
  }

  .seg-tabs {
    display: flex;
    gap: 6px;
    padding: 10px 16px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .seg-tabs button {
    flex: 1;
    padding: 8px 10px;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .seg-tabs button.active {
    background: var(--bg-card);
    color: var(--text-dark);
    box-shadow: var(--shadow-sm);
  }

  .tab-count {
    background: var(--budol-orange);
    color: white;
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }

  .scroll-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    min-height: 0;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .stat-tile {
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .tile-label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .stat-tile strong {
    font-size: 14px;
    color: var(--text-dark);
  }

  .about {
    margin: 0 0 14px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    font-size: 12px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    background: var(--success-bg);
    color: var(--success);
  }

  .menu-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .menu-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .menu-img {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  .menu-img.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    font-size: 24px;
  }

  .menu-content {
    flex: 1;
    min-width: 0;
  }

  .menu-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
  }

  .menu-head h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dark);
  }

  .menu-price {
    font-size: 14px;
    font-weight: 800;
    color: var(--budol-orange);
    white-space: nowrap;
  }

  .menu-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    background: var(--bg);
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .menu-highlight {
    display: block;
    font-size: 11px;
    color: var(--budol-orange);
    margin-bottom: 8px;
  }

  .add-cta {
    padding: 6px 12px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--primary-light);
    color: var(--budol-orange);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }

  .add-cta:hover {
    background: var(--budol-orange);
    color: white;
  }

  .cart-list {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cart-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 10px;
    align-items: center;
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .cart-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .cart-info strong {
    font-size: 13px;
    color: var(--text-dark);
  }

  .cart-info span {
    font-size: 11px;
    color: var(--text-muted);
  }

  .qty-stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .qty-stepper button {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: var(--bg-card);
    cursor: pointer;
    font-size: 16px;
    color: var(--text-dark);
  }

  .line-total {
    font-size: 13px;
    color: var(--text-dark);
    min-width: 56px;
    text-align: right;
  }

  .note-field {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .note-field textarea {
    width: 100%;
    margin-top: 6px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    resize: vertical;
    box-sizing: border-box;
    background: var(--bg-card);
    color: var(--text-dark);
  }

  .checkout-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    background: var(--bg-card);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  .checkout-total {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .checkout-total span {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .checkout-total strong {
    font-size: 18px;
    color: var(--text-dark);
  }

  .checkout-btn {
    padding: 12px 20px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--budol-orange);
    color: white;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .checkout-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .checkout-btn:hover:not(:disabled) {
    background: var(--budol-orange-hover);
  }

  .success-card,
  .empty-cart {
    text-align: center;
    padding: 32px 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .success-icon {
    display: inline-flex;
    width: 48px;
    height: 48px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--success-bg);
    color: var(--success);
    font-size: 24px;
    margin-bottom: 12px;
  }

  .success-card h3 {
    margin: 0 0 6px;
    font-size: 16px;
  }

  .success-card p {
    margin: 0 0 14px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .empty-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 8px;
  }

  .ghost-btn {
    padding: 10px 18px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    background: var(--bg-card);
    color: var(--budol-orange);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }

  .empty {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
    padding: 24px;
  }

  .error {
    color: var(--alert-red);
    font-size: 13px;
    margin: 0 0 8px;
  }
</style>
