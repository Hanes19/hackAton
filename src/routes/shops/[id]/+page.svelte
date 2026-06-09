<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import NavBar from '$lib/NavBar.svelte'
  import ShopReviews from '$lib/ShopReviews.svelte'
  import {
    formatDetailChips,
    getProductIndustry,
    getServiceType
  } from '$lib/listingCatalog'
  import {
    type MapShop,
    type MapProduct,
    priceRange,
    shopThumbnail,
    isOpenNow
  } from '$lib/mapShop'
  import { cartStore, addToCart, cartCount } from '$lib/cart'
  import { fetchShopReviews, starsDisplay } from '$lib/reviews'

  interface Product extends MapProduct {
    description: string
    industry?: string | null
    details?: Record<string, string> | null
  }

  interface Shop extends MapShop {
    products: Product[]
  }

  let shop = $state<Shop | null>(null)
  let error = $state('')
  let reviewAverage = $state(0)
  let reviewCount = $state(0)

  let cartQty = $derived(
    shop && $cartStore?.shopId === shop.id ? $cartCount : 0
  )

  onMount(async () => {
    const id = $page.params.id
    const res = await fetch(`/api/shops/${id}`)
    const data = await res.json()
    if (data.error) error = data.error
    else {
      shop = data
      try {
        const reviews = await fetchShopReviews(id)
        reviewAverage = reviews.summary.average
        reviewCount = reviews.summary.count
      } catch {
        /* use defaults */
      }
    }
  })

  function handleAdd(product: Product) {
    if (!shop) return
    addToCart(shop.id, shop.name, {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_data
    })
  }

  function goCheckout() {
    goto('/checkout')
  }

  function onReviewSummary(summary: { average: number; count: number }) {
    reviewAverage = summary.average
    reviewCount = summary.count
  }
</script>

<div class="shop-page">
  <NavBar variant="light" />

  {#if error}
    <div class="state-wrap">
      <p class="error">{error}</p>
      <a href="/map" class="back-link">← Back to map</a>
    </div>
  {:else if !shop}
    <div class="state-wrap">
      <span class="spinner" aria-hidden="true"></span>
      <p class="muted">Loading shop…</p>
    </div>
  {:else}
    <header class="hero">
      <img src={shopThumbnail(shop)} alt="" class="hero-img" />
      <div class="hero-shade"></div>
      <div class="hero-inner">
        <a href="/map" class="back-link">← Back to map</a>
        <div class="hero-card">
          <div class="hero-top">
            <div class="tags">
              <span class="tag category">{shop.category}</span>
              {#if shop.business_type}
                <span class="tag muted">
                  {shop.business_type === 'service' ? 'Services' : 'Products'}
                </span>
              {/if}
            </div>
            <span class="status-pill" class:open={isOpenNow(shop.id)}>
              {isOpenNow(shop.id) ? 'Open now' : 'Closed'}
            </span>
          </div>
          <h1>{shop.name}</h1>
          <div class="meta-row">
            <span class="rating-num">{reviewCount ? reviewAverage.toFixed(1) : '—'}</span>
            <span class="stars">{starsDisplay(reviewAverage)}</span>
            <span class="reviews">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
          </div>
          <p class="address">📍 {shop.address || 'Bukidnon, Philippines'}</p>
        </div>
      </div>
    </header>

    <main class="main">
      <section class="info-strip">
        <div class="info-tile">
          <span class="tile-label">Price range</span>
          <strong>{priceRange(shop.products)}</strong>
        </div>
        <div class="info-tile">
          <span class="tile-label">Listings</span>
          <strong>{shop.products?.length ?? 0} items</strong>
        </div>
        <div class="info-tile wide">
          <span class="tile-label">About</span>
          <p>{shop.description || 'A local business on Budol Map.'}</p>
        </div>
      </section>

      <section class="listings">
        <div class="section-head">
          <h2>{shop.business_type === 'service' ? 'Services' : 'Menu & products'}</h2>
          <a href="/map" class="map-link">View on map</a>
        </div>

        {#if shop.products && shop.products.length > 0}
          <div class="product-grid">
            {#each shop.products as product (product.id)}
              {@const isService = shop.business_type === 'service'}
              {@const chips = formatDetailChips(
                isService ? 'service' : 'product',
                product.industry ?? '',
                product.details ?? {}
              )}
              {@const catLabel = isService
                ? getServiceType(product.industry ?? 'personal_care').label
                : (product.subcategory || getProductIndustry(product.industry ?? 'food').label)}
              <article class="product-card">
                {#if product.image_data}
                  <img src={product.image_data} alt="" class="product-img" />
                {:else}
                  <div class="product-img placeholder">{isService ? '🛠' : '🍽'}</div>
                {/if}
                <div class="product-body">
                  <div class="product-head">
                    <div>
                      <div class="product-tags">
                        <span class="product-tag">{catLabel}</span>
                        {#if product.highlights}
                          <span class="product-tag highlight">{product.highlights}</span>
                        {/if}
                      </div>
                      <h3>{product.name}</h3>
                    </div>
                    <span class="product-price">₱{Number(product.price).toLocaleString()}</span>
                  </div>
                  {#if product.description}
                    <p class="product-desc">{product.description}</p>
                  {/if}
                  {#if chips.length}
                    <div class="chips">
                      {#each chips as chip}<span class="chip">{chip}</span>{/each}
                    </div>
                  {/if}
                  <button type="button" class="add-btn" onclick={() => handleAdd(product)}>
                    Add to cart
                  </button>
                </div>
              </article>
            {/each}
          </div>
        {:else}
          <p class="empty">No listings yet.</p>
        {/if}
      </section>

      <ShopReviews shopId={shop.id} shopName={shop.name} onSummary={onReviewSummary} />
    </main>

    {#if cartQty > 0}
      <div class="cart-bar">
        <div class="cart-bar-info">
          <strong>{cartQty} item{cartQty === 1 ? '' : 's'} in cart</strong>
          <span>Ready for checkout</span>
        </div>
        <button type="button" class="cart-bar-btn" onclick={goCheckout}>Checkout</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .shop-page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text-dark);
    font-family: var(--font-sans);
  }

  .state-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 24px;
    color: var(--text-muted);
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

  .hero {
    position: relative;
    min-height: 280px;
    background: var(--surface-dark);
  }

  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.35) 0%,
      rgba(0, 0, 0, 0.55) 55%,
      var(--bg) 100%
    );
  }

  .hero-inner {
    position: relative;
    max-width: 960px;
    margin: 0 auto;
    padding: 88px 20px 0;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    margin-bottom: 16px;
  }

  .back-link:hover {
    color: white;
  }

  .hero-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    box-shadow: var(--shadow-md);
  }

  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
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

  h1 {
    margin: 0 0 8px;
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    margin-bottom: 8px;
  }

  .rating-num {
    font-weight: 800;
  }

  .stars {
    color: #f5a623;
    letter-spacing: -1px;
  }

  .reviews {
    color: var(--text-muted);
  }

  .address {
    margin: 0;
    font-size: 14px;
    color: var(--text-muted);
  }

  .main {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 20px 100px;
  }

  .info-strip {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .info-tile {
    padding: 14px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .info-tile.wide {
    grid-column: 1 / -1;
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

  .info-tile strong {
    font-size: 15px;
  }

  .info-tile p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .map-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--budol-orange);
    text-decoration: none;
  }

  .map-link:hover {
    color: var(--budol-orange-hover);
  }

  .product-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .product-card {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .product-card:hover {
    border-color: rgba(255, 87, 34, 0.25);
    box-shadow: var(--shadow-md);
  }

  .product-img {
    width: 96px;
    height: 96px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  .product-img.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    font-size: 28px;
  }

  .product-body {
    flex: 1;
    min-width: 0;
  }

  .product-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 6px;
  }

  .product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .product-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    background: var(--bg);
    color: var(--text-muted);
  }

  .product-tag.highlight {
    background: var(--primary-light);
    color: var(--budol-orange);
  }

  .product-head h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-dark);
  }

  .product-price {
    font-size: 17px;
    font-weight: 800;
    color: var(--budol-orange);
    white-space: nowrap;
  }

  .product-desc {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-muted);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--success-bg);
    color: var(--success);
  }

  .add-btn {
    margin-top: 10px;
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--budol-orange);
    color: white;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .add-btn:hover {
    background: var(--budol-orange-hover);
  }

  .cart-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 20px;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }

  .cart-bar-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cart-bar-info strong {
    font-size: 14px;
    color: var(--text-dark);
  }

  .cart-bar-info span {
    font-size: 12px;
    color: var(--text-muted);
  }

  .cart-bar-btn {
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--budol-orange);
    color: white;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }

  .empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
  }

  .error {
    color: var(--alert-red);
    margin: 0;
  }

  .muted {
    margin: 0;
    font-size: 14px;
  }

  @media (max-width: 640px) {
    .hero-inner {
      padding-top: 76px;
    }

    .product-card {
      flex-direction: column;
    }

    .product-img,
    .product-img.placeholder {
      width: 100%;
      height: 160px;
    }

    .product-head {
      flex-direction: column;
    }
  }
</style>
