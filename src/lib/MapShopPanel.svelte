<script lang="ts">
  import MapShopList from '$lib/MapShopList.svelte'
  import MapShopDetail from '$lib/MapShopDetail.svelte'
  import type { MapShop } from '$lib/mapShop'
  import type { TravelMode } from '$lib/mapExplorer'

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
    travelMode: TravelMode
    isNavigating: boolean
    onCategoryChange: (cat: string) => void
    onSelectShop: (id: string | null) => void
    onGpsClick: () => void
    onToggleNav: () => void
    onTravelModeChange: (mode: TravelMode) => void
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

  let selectedListShop = $derived(shops.find((s) => s.id === focusedShopId) ?? null)
  let hasDetail = $derived(focusedShopId !== null)

  function handleSelectShop(id: string) {
    onSelectShop(id)
  }

  function handleBack() {
    onSelectShop(null)
    focusedShopId = null
  }
</script>

<aside class="explorer-panel" class:expanded={hasDetail} class:nav-hidden={isNavigating}>
  <section class="list-column" class:compact={hasDetail} aria-label="Shop results">
    {#if hasDetail}
      <div class="list-rail-head">
        <button type="button" class="rail-back" onclick={handleBack} aria-label="Back to full results">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Results</span>
        </button>
        <span class="rail-count">{filtered.length}</span>
      </div>
    {/if}

    <MapShopList
      mode={hasDetail ? 'compact' : 'full'}
      {filtered}
      bind:search
      {selectedCategory}
      {categories}
      {focusedShopId}
      {onCategoryChange}
      onSelectShop={handleSelectShop}
    />
  </section>

  {#if hasDetail && focusedShopId}
    <section class="detail-column" aria-label="Shop details">
      <MapShopDetail
        shopId={focusedShopId}
        listShop={selectedListShop}
        embedded
        {userLocation}
        {routeEta}
        {routeDistance}
        {isRouting}
        {travelMode}
        {isNavigating}
        onBack={handleBack}
        {onGpsClick}
        onToggleNav={onToggleNav}
        onTravelModeChange={onTravelModeChange}
      />
    </section>
  {/if}
</aside>

<style>
  .explorer-panel {
    width: 100%;
    max-width: 380px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    color: var(--text-dark);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    overflow: hidden;
    font-family: var(--font-sans);
    transition:
      max-width 0.32s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s ease;
  }

  .explorer-panel.expanded {
    flex-direction: row;
    max-width: 700px;
  }

  .explorer-panel.nav-hidden {
    transform: translateX(calc(-100% - 24px));
    opacity: 0;
    pointer-events: none;
  }

  .list-column {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    min-width: 0;
  }

  .list-column.compact {
    flex: 0 0 248px;
    width: 248px;
    border-right: 1px solid var(--border);
    background: var(--bg);
  }

  .list-rail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    flex-shrink: 0;
  }

  .rail-back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    color: var(--budol-orange);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
  }

  .rail-back:hover {
    color: var(--budol-orange-hover);
  }

  .rail-count {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    background: var(--bg);
    padding: 4px 8px;
    border-radius: var(--radius-pill);
  }

  .detail-column {
    flex: 1;
    min-width: 0;
    width: 420px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--bg-card);
    animation: detailIn 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes detailIn {
    from {
      opacity: 0;
      transform: translateX(12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 768px) {
    .explorer-panel.expanded {
      flex-direction: column;
      max-width: none;
    }

    .list-column.compact {
      display: none;
    }

    .detail-column {
      width: 100%;
      flex: 1;
      animation: none;
    }
  }
</style>
