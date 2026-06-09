<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import NavBar from '$lib/NavBar.svelte'

  interface Product {
    id: string
    name: string
    price: number
    description: string
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

      <h2>{shop.business_type === 'service' ? 'Services' : 'Products & Services'}</h2>

      {#if shop.products && shop.products.length > 0}
        <div class="listing-list">
          {#each shop.products as product (product.id)}
            <div class="listing-item">
              <div>
                <p class="listing-name">{product.name}</p>
                <p class="listing-desc">{product.description}</p>
              </div>
              <span class="price">₱{product.price}</span>
            </div>
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
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  .back-link {
    font-size: 13px;
    color: #666;
    text-decoration: none;
  }

  .back-link:hover {
    color: #e84c3d;
  }

  .shop-header {
    margin-top: 1rem;
  }

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

  .address {
    color: #666;
    font-size: 14px;
    margin: 0;
  }

  .description {
    margin-top: 0.75rem;
    color: #444;
    line-height: 1.6;
  }

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
    gap: 10px;
  }

  .listing-item {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .listing-name {
    font-weight: 500;
    font-size: 14px;
    margin: 0;
  }

  .listing-desc {
    font-size: 13px;
    color: #666;
    margin: 2px 0 0;
  }

  .price {
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    margin-left: 1rem;
  }

  .error {
    color: #c0392b;
    margin-top: 1rem;
  }

  .muted {
    color: #999;
    font-size: 14px;
    margin-top: 1rem;
  }
</style>
