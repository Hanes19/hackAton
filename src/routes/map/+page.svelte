<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import MapView from '$lib/MapView.svelte'
  import { getUser, logout } from '$lib/auth'
  import type { User } from '@supabase/supabase-js'
  import { theme } from '$lib/theme'

  interface Shop {
    id: string
    name: string
    category: string
    lat: number
    lng: number
    address: string
    description: string
  }

  let shops = $state<Shop[]>([])
  let search = $state('')
  let selectedCategory = $state('All')
  let user = $state<User | null>(null)

  const categories = ['All', 'Food', 'Clothing', 'Electronics', 'Services', 'Health & Beauty', 'Other']

  let filtered = $derived(
    shops.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
      const matchCategory = selectedCategory === 'All' || s.category === selectedCategory
      return matchSearch && matchCategory
    })
  )

  onMount(async () => {
    const [shopsRes, currentUser] = await Promise.all([
      fetch('/api/shops').then(r => r.json()),
      getUser()
    ])
    shops = shopsRes
    user = currentUser
  })

  async function handleLogout() {
    await logout()
    user = null
    goto('/')
  }
</script>

<div style="height: 100vh; display: flex; flex-direction: column;">

  <!-- Navbar -->
  <header style="padding: 0.75rem 1.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-shrink: 0;">
   <h1 style="font-size: 1.2rem; font-weight: 600; white-space: nowrap;">Budol Map</h1>
    <input bind:value={search} placeholder="Search shops or categories..." style="flex: 1; max-width: 400px;" />
    <div style="display: flex; gap: 8px; align-items: center;">
      <a href="/register" style="font-size: 13px; background: #1a1a1a; color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none; white-space: nowrap;">+ Add shop</a>
      {#if user}
      <a href="/dashboard" style="font-size: 13px; color: #666; text-decoration: none;">My Shop</a>
        <a href="/admin" style="font-size: 13px; color: #666; text-decoration: none;">Admin</a>
        <span style="font-size: 13px; color: #666;">{user.user_metadata.name || user.email}</span>
        <button onclick={() => theme.toggle()} style="margin-left: auto; font-size: 16px; background: none; border: 1px solid #ddd; border-radius: 6px; padding: 4px 8px; cursor: pointer; flex-shrink: 0;">🌙</button>
        <button onclick={handleLogout} style="font-size: 13px; padding: 6px 14px;">Logout</button>
      {:else}
        <a href="/login" style="font-size: 13px; padding: 6px 14px; border: 1px solid #ddd; border-radius: 6px; text-decoration: none; color: #333;">Login</a>
      {/if}
    </div>
    
  </header>

  <!-- Category Filter Bar -->

<div style="padding: 8px 1.5rem; border-bottom: 1px solid #eee; display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0; background: #fafafa; align-items: center;">
  {#each categories as cat (cat)}
    <button
      onclick={() => selectedCategory = cat}
      style="padding: 5px 14px; font-size: 12px; border-radius: 20px; white-space: nowrap; cursor: pointer; background: {selectedCategory === cat ? '#1a1a1a' : 'white'}; color: {selectedCategory === cat ? 'white' : '#555'}; border: 1px solid {selectedCategory === cat ? '#1a1a1a' : '#ddd'};">
      {cat}
      {#if cat !== 'All'}
        <span style="opacity: 0.6;">({shops.filter(s => s.category === cat).length})</span>
      {:else}
        <span style="opacity: 0.6;">({shops.length})</span>
      {/if}
    </button>
  {/each}
  
</div>

  <!-- Map -->
  <div style="flex: 1;">
    <MapView shops={filtered} />
  </div>

</div>