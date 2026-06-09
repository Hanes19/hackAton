<script lang="ts">
  import {
    type MapShop,
    shopRating,
    shopReviewCount,
    priceRange,
    shopThumbnail,
    isOpenNow,
    hasFlashDeal
  } from '$lib/mapShop'

  interface Props {
    mode?: 'full' | 'compact'
    filtered: MapShop[]
    search: string
    selectedCategory: string
    categories: string[]
    focusedShopId: string | null
    onCategoryChange: (cat: string) => void
    onSelectShop: (id: string) => void
  }

  let {
    mode = 'full',
    filtered,
    search = $bindable(),
    selectedCategory,
    categories,
    focusedShopId,
    onCategoryChange,
    onSelectShop
  }: Props = $props()

  let isCompact = $derived(mode === 'compact')

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
</script>

<div class="list-view" class:compact={isCompact}>
  {#if !isCompact}
    <header class="list-header">
      <div>
        <p class="eyebrow">Bukidnon</p>
        <h2>Discover local shops</h2>
      </div>
      <span class="count-badge">{filtered.length}</span>
    </header>
  {/if}

  <div class="search-bar">
    <span class="search-icon" aria-hidden="true">🔍</span>
    <input
      bind:value={search}
      placeholder={isCompact ? 'Search…' : 'Search shops, products, categories…'}
      class="search-input"
      aria-label="Search shops"
    />
    {#if search}
      <button type="button" class="clear-btn" onclick={() => (search = '')} aria-label="Clear search">
        ×
      </button>
    {/if}
  </div>

  <div class="category-rail" role="tablist" aria-label="Shop categories">
    {#each categories as cat (cat)}
      <button
        type="button"
        role="tab"
        class="cat-chip"
        class:active={selectedCategory === cat}
        aria-selected={selectedCategory === cat}
        onclick={() => onCategoryChange(cat)}
      >
        {cat}
      </button>
    {/each}
  </div>

  <div class="results-scroll">
    {#each filtered as shop (shop.id)}
      {@const rating = shopRating(shop.id)}
      {@const reviews = shopReviewCount(shop.id)}
      {@const open = isOpenNow(shop.id)}
      {@const flashDeal = hasFlashDeal(shop.id)}
      <button
        type="button"
        class="shop-card"
        class:selected={focusedShopId === shop.id}
        onclick={() => onSelectShop(shop.id)}
      >
        <img src={shopThumbnail(shop)} alt="" class="shop-thumb" />
        <div class="shop-body">
          {#if flashDeal && !isCompact}
            <span class="flash-deal">Flash deal</span>
          {/if}
          {#if flashDeal && isCompact}
            <span class="flash-dot" title="Flash deal"></span>
          {/if}
          <div class="shop-top">
            <h3>{shop.name}</h3>
            {#if !isCompact}
              <span class="status" class:open>{open ? 'Open' : 'Closed'}</span>
            {/if}
          </div>
          {#if isCompact}
            <p class="compact-meta">{shop.category} · {rating.toFixed(1)}★</p>
          {:else}
            <div class="rating-row">
              <span class="rating-num">{rating.toFixed(1)}</span>
              <span class="rating-stars">{stars(rating)}</span>
              <span class="review-count">({reviews})</span>
            </div>
            <p class="meta">
              <span>{priceRange(shop.products)}</span>
              <span class="dot">·</span>
              <span>{shop.category}</span>
            </p>
            <p class="address">{shop.address || 'Bukidnon'}</p>
            <p class="snippet">{snippet(shop.description)}</p>
            {#if shop.products?.length}
              <span class="order-hint">
                Order · {shop.products.length} item{shop.products.length === 1 ? '' : 's'}
              </span>
            {/if}
          {/if}
        </div>
      </button>
    {:else}
      <div class="empty-state">
        <span class="empty-icon">🗺️</span>
        <p>No shops match.</p>
        {#if !isCompact}
          <p class="empty-hint">Try a different category or keyword.</p>
        {/if}
      </div>
    {/each}
  </div>

  {#if !isCompact}
    <footer class="list-footer">
      <label class="sync-note">
        <input type="checkbox" checked disabled />
        Update results when map moves
      </label>
    </footer>
  {/if}
</div>

<style>
  .list-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    flex: 1;
  }

  .list-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 20px 12px;
  }

  .eyebrow {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--budol-orange);
  }

  .list-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-dark);
    line-height: 1.2;
  }

  .count-badge {
    flex-shrink: 0;
    background: var(--primary-light);
    color: var(--budol-orange);
    font-size: 12px;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 12px 10px;
    padding: 9px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .compact .search-bar {
    margin-top: 10px;
  }

  .search-bar:focus-within {
    border-color: var(--budol-orange);
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .search-icon {
    font-size: 14px;
    opacity: 0.55;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--text-dark);
    background: transparent;
    min-width: 0;
  }

  .clear-btn {
    border: none;
    background: var(--border);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    color: var(--text-muted);
  }

  .category-rail {
    display: flex;
    gap: 6px;
    padding: 0 12px 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .category-rail::-webkit-scrollbar {
    display: none;
  }

  .compact .cat-chip {
    padding: 5px 10px;
    font-size: 11px;
  }

  .flash-deal {
    display: inline-block;
    margin-bottom: 6px;
    padding: 3px 8px;
    background: var(--alert-red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--radius-pill);
  }

  .flash-dot {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--alert-red);
    border: 2px solid white;
    box-shadow: 0 0 0 1px var(--alert-red);
  }

  .cat-chip {
    border: 1px solid var(--border-strong);
    background: var(--bg-card);
    color: var(--text-muted);
    padding: 7px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s;
  }

  .cat-chip:hover:not(.active) {
    border-color: var(--text-muted);
    color: var(--text-dark);
  }

  .cat-chip.active {
    background: var(--budol-orange);
    border-color: var(--budol-orange);
    color: var(--text-inverse);
  }

  .results-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 8px;
    min-height: 0;
  }

  .shop-card {
    display: flex;
    gap: 10px;
    width: 100%;
    text-align: left;
    padding: 10px;
    margin-bottom: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    position: relative;
  }

  .shop-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-sm);
  }

  .shop-card.selected {
    border-color: var(--budol-orange);
    background: var(--primary-light);
    box-shadow: inset 3px 0 0 var(--budol-orange);
  }

  .compact .shop-card {
    padding: 8px;
    gap: 8px;
    border-radius: 10px;
  }

  .shop-thumb {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 10px;
    flex-shrink: 0;
    background: var(--bg);
  }

  .compact .shop-thumb {
    width: 44px;
    height: 44px;
    border-radius: 8px;
  }

  .shop-body {
    flex: 1;
    min-width: 0;
  }

  .shop-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 2px;
  }

  .shop-top h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-dark);
    line-height: 1.3;
  }

  .compact .shop-top h3 {
    font-size: 13px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .compact-meta {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
  }

  .status {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgba(244, 67, 54, 0.1);
    color: var(--alert-red);
  }

  .status.open {
    background: var(--success-bg);
    color: var(--success);
  }

  .rating-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-bottom: 2px;
  }

  .rating-num {
    font-weight: 700;
    color: var(--text-dark);
  }

  .rating-stars {
    color: #f9ab00;
    letter-spacing: -1px;
  }

  .review-count {
    color: var(--text-muted);
  }

  .meta,
  .address {
    margin: 0 0 2px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .address {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dot {
    margin: 0 4px;
  }

  .snippet {
    margin: 4px 0 0;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .order-hint {
    display: inline-block;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--budol-orange);
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 28px;
    display: block;
    margin-bottom: 8px;
  }

  .empty-state p {
    margin: 0;
    font-size: 13px;
  }

  .empty-hint {
    margin-top: 6px !important;
    font-size: 12px !important;
  }

  .list-footer {
    flex-shrink: 0;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }

  .sync-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
