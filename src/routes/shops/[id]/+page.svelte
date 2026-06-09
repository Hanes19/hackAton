<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import NavBar from '$lib/NavBar.svelte'
  import {
    formatDetailChips,
    getProductIndustry,
    getServiceType
  } from '$lib/listingCatalog'

  interface Product {
    id: string
    name: string
    price: number
    description: string
    highlights?: string | null
    listing_type?: string | null
    industry?: string | null
    subcategory?: string | null
    image_data?: string | null
    details?: Record<string, string> | null
  }

  interface Shop {
    id: string
    name: string
    description: string
    category: string
    address: string
    lat: number
    lng: number
    business_type?: string | null
    products: Product[]
  }

  let shop = $state<Shop | null>(null)
  let error = $state('')

  onMount(async () => {
    const id = $page.params.id
    const res = await fetch(`/api/shops/${id}`)
    const data = await res.json()
    if (data.error) error = data.error
    else shop = data
  })
</script>

<div class="shop-page">
  <NavBar variant="light" />

  <div class="content">
    <a href="/map" class="back-link">← Back to map</a>

    {#if error}
      <p class="error">{error}</p>
    {:else if !shop}
      <p class="muted">Loading...</p>
    {:else}
      <div class="shop-header">
        <span class="category">{shop.category}</span>
        {#if shop.business_type}
          <span class="type-badge">{shop.business_type === 'service' ? 'Service' : 'Product'} shop</span>
        {/if}
        <h1>{shop.name}</h1>
        <p class="address">📍 {shop.address}</p>
        <p class="description">{shop.description}</p>
      </div>

      <hr />

      <h2>{shop.business_type === 'service' ? 'Services' : 'Products'}</h2>

      {#if shop.products && shop.products.length > 0}
        <div class="listing-list">
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
            <article class="listing-item">
              {#if product.image_data}
                <img src={product.image_data} alt="" class="listing-photo" />
              {:else}
                <div class="listing-photo placeholder">{isService ? '🛠' : '📦'}</div>
              {/if}
              <div class="listing-body">
                <div class="tags">
                  <span class="tag">{catLabel}</span>
                  {#if product.highlights}<span class="tag gold">{product.highlights}</span>{/if}
                </div>
                <h3>{product.name}</h3>
                <p class="listing-desc">{product.description}</p>
                {#if chips.length}
                  <div class="details">
                    {#each chips as chip}<span class="detail">{chip}</span>{/each}
                  </div>
                {/if}
              </div>
              <span class="price">₱{Number(product.price).toLocaleString()}</span>
            </article>
          {/each}
        </div>
      {:else}
        <p class="muted">No listings yet.</p>
      {/if}
    {/if}
  </div>
</div>

<style>
  .shop-page {
    min-height: 100vh;
    background: #fff;
    font-family: 'Segoe UI', sans-serif;
  }

  .content {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  .back-link {
    font-size: 13px;
    color: #666;
    text-decoration: none;
  }

  .back-link:hover { color: #e84c3d; }

  .shop-header { margin-top: 1rem; }

  .category {
    font-size: 12px;
    background: #f0f0f0;
    padding: 3px 10px;
    border-radius: 20px;
    color: #555;
  }

  .type-badge {
    font-size: 11px;
    background: #e8f4fc;
    color: #0d58b0;
    padding: 3px 10px;
    border-radius: 20px;
    margin-left: 6px;
  }

  h1 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0.5rem 0;
    color: #1a1a1a;
  }

  .address { color: #666; font-size: 14px; margin: 0; }
  .description { margin-top: 0.75rem; color: #444; line-height: 1.6; }

  hr {
    margin: 1.5rem 0;
    border: none;
    border-top: 1px solid #eee;
  }

  h2 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .listing-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .listing-item {
    border: 1px solid #eee;
    border-radius: 12px;
    padding: 14px;
    display: grid;
    grid-template-columns: 100px 1fr auto;
    gap: 14px;
    align-items: start;
  }

  @media (max-width: 520px) {
    .listing-item { grid-template-columns: 80px 1fr; }
    .price { grid-column: 2; justify-self: start; margin-top: 4px; }
  }

  .listing-photo {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 10px;
  }

  .listing-photo.placeholder {
    display: grid;
    place-items: center;
    background: #f5f5f5;
    font-size: 2rem;
  }

  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }

  .tag {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 12px;
    background: #e8f4fc;
    color: #0d58b0;
  }

  .tag.gold { background: #fef3c7; color: #b45309; }

  .listing-body h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .listing-desc {
    font-size: 13px;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }

  .details {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .detail {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .price {
    font-weight: 700;
    font-size: 16px;
    color: #e84c3d;
    white-space: nowrap;
  }

  .error { color: #c0392b; margin-top: 1rem; }
  .muted { color: #999; font-size: 14px; margin-top: 1rem; }
</style>
