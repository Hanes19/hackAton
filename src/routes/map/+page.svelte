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

<div class="layout">

  <!-- Navbar -->
  <header class="navbar">
    <div class="brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 6l7-4 7 4v8l-7 4-7-4V6z" stroke="#79E0E9" stroke-width="1.5" fill="none"/>
          <path d="M10 2v16M3 6l7 4 7-4" stroke="#49B6EA" stroke-width="1.5"/>
        </svg>
      </div>
      <span class="brand-name">Budol Map</span>
    </div>

    <div class="search-wrap">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M10.5 10.5l3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <input bind:value={search} placeholder="Search shops or categories…" class="search-input" />
    </div>

    <nav class="nav-actions">
      <a href="/register" class="btn-primary">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        Add shop
      </a>

      {#if user}
        <a href="/dashboard" class="nav-link">My Shop</a>
        <a href="/admin" class="nav-link">Admin</a>
        <span class="nav-user">
          <div class="avatar">{(user.user_metadata.name || user.email || 'U')[0].toUpperCase()}</div>
          <span>{user.user_metadata.name || user.email}</span>
        </span>
        <button onclick={() => theme.toggle()} class="icon-btn" title="Toggle theme">🌙</button>
        <button onclick={handleLogout} class="btn-outline">Logout</button>
      {:else}
        <a href="/login" class="btn-outline">Login</a>
      {/if}
    </nav>
  </header>

  <!-- Category Filter Bar -->
  <div class="filter-bar">
    {#each categories as cat (cat)}
      {@const count = cat === 'All' ? shops.length : shops.filter(s => s.category === cat).length}
      <button
        onclick={() => selectedCategory = cat}
        class="pill"
        class:active={selectedCategory === cat}
      >
        {cat}
        <span class="pill-count">{count}</span>
      </button>
    {/each}
  </div>

  <!-- Map -->
  <div class="map-area">
    <MapView shops={filtered} />
  </div>

</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #070f1f;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }

  .layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #070f1f;
    color: #e8f4fc;
  }

  /* ── Navbar ── */
  .navbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1.25rem;
    height: 56px;
    flex-shrink: 0;
    background: #0c1a35;
    border-bottom: 1px solid rgba(73, 182, 234, 0.15);
    box-shadow: 0 1px 20px rgba(0, 0, 0, 0.4);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .brand-icon {
    width: 32px;
    height: 32px;
    background: rgba(73, 182, 234, 0.1);
    border: 1px solid rgba(73, 182, 234, 0.25);
    border-radius: 8px;
    display: grid;
    place-items: center;
  }
  .brand-name {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #e8f4fc;
    white-space: nowrap;
  }

  /* Search */
  .search-wrap {
    position: relative;
    flex: 1;
    max-width: 420px;
  }
  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #2d5580;
    pointer-events: none;
    transition: color 0.2s;
  }
  .search-wrap:focus-within .search-icon {
    color: #49b6ea;
  }
  .search-input {
    width: 100%;
    padding: 8px 12px 8px 32px;
    background: #091525;
    border: 1px solid #143e88;
    border-radius: 8px;
    color: #e8f4fc;
    font-size: 13.5px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    font-family: inherit;
  }
  .search-input::placeholder { color: #2d5580; }
  .search-input:focus {
    border-color: #49b6ea;
    box-shadow: 0 0 0 3px rgba(121, 224, 233, 0.1);
  }

  /* Nav actions */
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;
  }
  .nav-link {
    font-size: 13px;
    color: #84b9d5;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .nav-link:hover {
    color: #49b6ea;
    background: rgba(73, 182, 234, 0.08);
  }
  .nav-user {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: #6eb3da;
    padding: 0 4px;
  }
  .avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0d58b0, #49b6ea);
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 13px;
    background: linear-gradient(135deg, #0d58b0 0%, #49b6ea 100%);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: opacity 0.2s, box-shadow 0.2s;
    box-shadow: 0 3px 12px rgba(13, 88, 176, 0.4);
    font-family: inherit;
  }
  .btn-primary:hover {
    opacity: 0.88;
    box-shadow: 0 4px 18px rgba(73, 182, 234, 0.35);
  }
  .btn-outline {
    padding: 6px 13px;
    background: transparent;
    border: 1px solid rgba(73, 182, 234, 0.3);
    border-radius: 7px;
    color: #84b9d5;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    font-family: inherit;
  }
  .btn-outline:hover {
    border-color: #49b6ea;
    color: #49b6ea;
    background: rgba(73, 182, 234, 0.06);
  }
  .icon-btn {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(73, 182, 234, 0.2);
    border-radius: 7px;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 14px;
    transition: background 0.2s, border-color 0.2s;
  }
  .icon-btn:hover {
    background: rgba(73, 182, 234, 0.1);
    border-color: rgba(73, 182, 234, 0.4);
  }

  /* ── Filter bar ── */
  .filter-bar {
    display: flex;
    gap: 6px;
    padding: 8px 1.25rem;
    overflow-x: auto;
    flex-shrink: 0;
    background: #091525;
    border-bottom: 1px solid rgba(20, 62, 136, 0.6);
    scrollbar-width: none;
    align-items: center;
  }
  .filter-bar::-webkit-scrollbar { display: none; }

  .pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 13px;
    font-size: 12.5px;
    font-weight: 500;
    border-radius: 20px;
    white-space: nowrap;
    cursor: pointer;
    border: 1px solid rgba(20, 62, 136, 0.7);
    background: transparent;
    color: #4d7a9e;
    transition: all 0.18s;
    font-family: inherit;
  }
  .pill:hover:not(.active) {
    border-color: #49b6ea;
    color: #84b9d5;
    background: rgba(73, 182, 234, 0.07);
  }
  .pill.active {
    background: linear-gradient(135deg, #0d58b0, #49b6ea);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 2px 10px rgba(13, 88, 176, 0.4);
  }
  .pill-count {
    opacity: 0.65;
    font-size: 11px;
  }
  .pill.active .pill-count {
    opacity: 0.8;
  }

  /* ── Map ── */
  .map-area {
    flex: 1;
    min-height: 0;
    position: relative;
  }
</style>