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
  // product form
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
      name: shopName,
      description: shopDesc,
      category: shopCategory,
      address: shopAddress,
      lat: shopLat,
      lng: shopLng,
      user_id: user.id
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
    .from('shops')
    .select('*, products(*)')
    .eq('user_id', user.id)
    .single()

  console.log('shop data:', data)
  shop = data
  loading = false

  // init picker map after render
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
    .insert([{
      shop_id: shop.id,
      name: productName,
      price: Number(productPrice),
      description: productDesc
    }])
    .select()

  saving = false
  if (error) { message = error.message; return }
  shop.products = [...(shop.products ?? []), data[0]]
  productName = ''
  productPrice = 0
  productDesc = ''
  message = 'Product added!'
  activeTab = 'products'
}

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    if (shop) shop.products = shop.products.filter(p => p.id !== id)
  }
</script>

<div style="min-height: 100vh; background: #f9f9f9;">
  <header style="background: white; border-bottom: 1px solid #eee; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">
    <h1 style="font-size: 1rem; font-weight: 600;">Budol Map — Seller Dashboard</h1>
    <a href="/" style="font-size: 13px; color: #666; text-decoration: none;">← Back to map</a>
  </header>

  <div style="max-width: 800px; margin: 2rem auto; padding: 0 1rem;">

    {#if loading}
      <p style="color: #999;">Loading...</p>

    {:else if !shop}
  <div style="background: white; border-radius: 10px; border: 1px solid #eee; padding: 2rem;">
    <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">Become a Seller</h2>
    <p style="font-size: 13px; color: #666; margin-bottom: 1.5rem;">Register your shop to start selling on LocalMarket. Your shop will appear on the map for buyers to discover.</p>

    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label for="sname" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Shop name</label>
        <input id="sname" bind:value={shopName} placeholder="e.g. Juan's Bakery" style="width: 100%;" />
      </div>
      <div>
        <label for="scat" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Category</label>
        <select id="scat" bind:value={shopCategory} style="width: 100%;">
          <option>Food</option>
          <option>Clothing</option>
          <option>Electronics</option>
          <option>Services</option>
          <option>Health & Beauty</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label for="sdesc" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Description</label>
        <textarea id="sdesc" bind:value={shopDesc} placeholder="What do you sell?" rows="3" style="width: 100%;"></textarea>
      </div>
      <div>
        <label for="saddr" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Address</label>
        <input id="saddr" bind:value={shopAddress} placeholder="e.g. Malaybalay City, Bukidnon" style="width: 100%;" />
      </div>
      <div>
        <label style="font-size: 13px; color: #666; display: block; margin-bottom: 6px;">📍 Pin your shop location</label>
        <p style="font-size: 12px; color: #999; margin-bottom: 8px;">Click anywhere on the map to set your shop's location.</p>
        <div id="picker-map" style="height: 280px; border-radius: 10px; border: 1px solid #ddd; overflow: hidden;"></div>
        {#if shopLat && shopLng}
          <p style="font-size: 12px; color: #10b981; margin-top: 6px;">✓ Location set: {shopLat.toFixed(4)}, {shopLng.toFixed(4)}</p>
        {/if}
      </div>

      {#if registerError}
        <div style="background: #fde8e8; border-radius: 8px; padding: 0.75rem; color: #9b2c2c; font-size: 13px;">{registerError}</div>
      {/if}

      <button onclick={registerShop} disabled={registering}>
        {registering ? 'Registering...' : 'Register my shop'}
      </button>
    </div>
  </div>

    {:else}
      <!-- Shop Header -->
      <div style="background: white; border-radius: 10px; border: 1px solid #eee; padding: 1.5rem; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span style="font-size: 11px; background: #f0f0f0; padding: 2px 8px; border-radius: 20px; color: #555;">{shop.category}</span>
            <h2 style="font-size: 1.3rem; font-weight: 700; margin: 6px 0 4px;">{shop.name}</h2>
            <p style="font-size: 13px; color: #666;">📍 {shop.address}</p>
            <p style="font-size: 13px; color: #888; margin-top: 4px;">{shop.description}</p>
          </div>
          <a href="/shops/{shop.id}" style="font-size: 12px; color: #3b82f6; text-decoration: none;">View public page →</a>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
        {#each [
          { id: 'overview', label: 'Overview' },
          { id: 'products', label: `Products (${shop.products?.length ?? 0})` },
          { id: 'add-product', label: '+ Add Product' }
        ] as tab (tab.id)}
          <button
            onclick={() => activeTab = tab.id as typeof activeTab}
            style="padding: 6px 16px; font-size: 13px; border-radius: 6px; background: {activeTab === tab.id ? '#1a1a1a' : 'white'}; color: {activeTab === tab.id ? 'white' : '#333'}; border: 1px solid {activeTab === tab.id ? '#1a1a1a' : '#ddd'}; cursor: pointer;">
            {tab.label}
          </button>
        {/each}
      </div>

      <!-- Overview -->
      {#if activeTab === 'overview'}
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          {#each [
            { label: 'Total Products', value: shop.products?.length ?? 0 },
            { label: 'Shop Category', value: shop.category },
            { label: 'Location', value: shop.address.split(',')[0] }
          ] as stat (stat.label)}
            <div style="background: white; border-radius: 10px; border: 1px solid #eee; padding: 1.25rem;">
              <div style="font-size: 22px; font-weight: 700;">{stat.value}</div>
              <div style="font-size: 12px; color: #999; margin-top: 4px;">{stat.label}</div>
            </div>
          {/each}
        </div>

      <!-- Products -->
      {:else if activeTab === 'products'}
        {#if !shop.products || shop.products.length === 0}
          <div style="background: white; border-radius: 10px; border: 1px solid #eee; padding: 2rem; text-align: center; color: #999; font-size: 14px;">
            No products yet. Add your first one!
          </div>
        {:else}
          <div style="display: flex; flex-direction: column; gap: 10px;">
            {#each shop.products as product (product.id)}
              <div style="background: white; border-radius: 10px; border: 1px solid #eee; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="font-size: 14px; font-weight: 500;">{product.name}</p>
                  <p style="font-size: 12px; color: #999; margin-top: 2px;">{product.description}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 15px; font-weight: 600;">₱{product.price}</span>
                  <button onclick={() => deleteProduct(product.id)} style="font-size: 12px; padding: 4px 10px; background: #fde8e8; color: #9b2c2c; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

      <!-- Add Product -->
      {:else if activeTab === 'add-product'}
        <div style="background: white; border-radius: 10px; border: 1px solid #eee; padding: 1.5rem;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label for="pname" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Product name</label>
              <input id="pname" bind:value={productName} placeholder="e.g. Bukidnon Pineapple Jam" style="width: 100%;" />
            </div>
            <div>
              <label for="pprice" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Price (₱)</label>
              <input id="pprice" type="number" bind:value={productPrice} placeholder="0" style="width: 100%;" />
            </div>
            <div>
              <label for="pdesc" style="font-size: 13px; color: #666; display: block; margin-bottom: 4px;">Description</label>
              <textarea id="pdesc" bind:value={productDesc} placeholder="Describe the product..." rows="3" style="width: 100%;"></textarea>
            </div>
            {#if message}
              <div style="background: #e6f4ea; border-radius: 8px; padding: 0.75rem; color: #2d6a4f; font-size: 13px;">{message}</div>
            {/if}
            <button onclick={addProduct} disabled={saving}>
              {saving ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>