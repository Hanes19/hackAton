<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'

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

<div style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
  <a href="/" style="font-size: 13px; color: #666;">← Back to map</a>

  {#if error}
    <p style="color: red; margin-top: 1rem;">{error}</p>
  {:else if !shop}
    <p style="margin-top: 1rem; color: #999;">Loading...</p>
  {:else}
    <div style="margin-top: 1rem;">
      <span style="font-size: 12px; background: #f0f0f0; padding: 3px 10px; border-radius: 20px; color: #555;">{shop.category}</span>
      <h1 style="font-size: 1.6rem; font-weight: 700; margin: 0.5rem 0;">{shop.name}</h1>
      <p style="color: #666; font-size: 14px;">📍 {shop.address}</p>
      <p style="margin-top: 0.75rem; color: #444; line-height: 1.6;">{shop.description}</p>

      <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #eee;" />

      <h2 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Products & Services</h2>

      {#if shop.products && shop.products.length > 0}
        <div style="display: flex; flex-direction: column; gap: 10px;">
          {#each shop.products as product (product.id)}
            <div style="border: 1px solid #eee; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <p style="font-weight: 500; font-size: 14px;">{product.name}</p>
                <p style="font-size: 13px; color: #666; margin-top: 2px;">{product.description}</p>
              </div>
              <span style="font-weight: 600; font-size: 15px; white-space: nowrap; margin-left: 1rem;">₱{product.price}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p style="color: #999; font-size: 14px;">No products listed yet.</p>
      {/if}
    </div>
  {/if}
</div>