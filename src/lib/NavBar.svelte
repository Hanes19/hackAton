<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getSessionInfo, logout, type SessionInfo } from '$lib/auth'
  import { supabase } from '$lib/supabase'
  import { loginUrl, registerUserUrl } from '$lib/navigation'

  let {
    variant = 'dark',
    center
  }: {
    variant?: 'light' | 'dark'
    center?: Snippet
  } = $props()

  let session = $state<SessionInfo>({
    user: null,
    isAdmin: false,
    hasShop: false,
    displayName: null
  })
  let loading = $state(true)

  const path = $derived($page.url.pathname)

  function isActive(href: string) {
    if (href === '/') return path === '/'
    return path === href || path.startsWith(href + '/')
  }

  async function refreshSession() {
    loading = true
    session = await getSessionInfo()
    loading = false
  }

  async function handleLogout() {
    await logout()
    session = { user: null, isAdmin: false, hasShop: false, displayName: null }
    goto('/')
  }

  onMount(() => {
    refreshSession()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshSession()
    })
    return () => sub.subscription.unsubscribe()
  })
</script>

<header class="navbar" class:light={variant === 'light'} class:dark={variant === 'dark'}>
  <a href="/" class="brand">
    <img src="/logo.png" alt="" class="logo" />
    <span class="brand-text">Budol <span class="accent">Map</span></span>
  </a>

  {#if center}
    <div class="center">
      {@render center()}
    </div>
  {/if}

  <nav class="nav-links" aria-label="Main navigation">
    <a href="/" class="nav-link" class:active={isActive('/')}>Home</a>
    <a href="/map" class="nav-link" class:active={isActive('/map')}>Map</a>

    {#if loading}
      <span class="nav-muted">…</span>
    {:else if session.user}
      <a href="/dashboard" class="nav-link" class:active={isActive('/dashboard')}>
        {session.hasShop ? 'Seller Dashboard' : 'Become a Seller'}
      </a>
      {#if session.isAdmin}
        <a href="/admin" class="nav-link" class:active={isActive('/admin')}>Admin</a>
      {/if}
      <span class="user-chip" title={session.user.email ?? ''}>
        {session.displayName ?? 'Account'}
      </span>
      <button type="button" class="btn btn-outline" onclick={handleLogout}>Logout</button>
    {:else}
      <a href="/register" class="nav-link" class:active={isActive('/register')}>Register Shop</a>
      <a href={loginUrl(path)} class="btn btn-outline">Login</a>
      <a href={registerUserUrl(path)} class="btn btn-primary">Get Started</a>
    {/if}
  </nav>
</header>

<style>
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 1.25rem;
    height: 60px;
    flex-shrink: 0;
    z-index: 200;
    position: sticky;
    top: 0;
  }

  .navbar.dark {
    background: #0c1a35;
    border-bottom: 1px solid rgba(73, 182, 234, 0.15);
  }

  .navbar.light {
    background: #fff;
    border-bottom: 1px solid #eee;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .logo {
    height: 36px;
    width: 36px;
    object-fit: contain;
  }

  .brand-text {
    font-size: 1.1rem;
    font-weight: 700;
    color: #e8f4fc;
  }

  .navbar.light .brand-text {
    color: #1a1a1a;
  }

  .accent {
    color: #e84c3d;
  }

  .center {
    flex: 1;
    max-width: 420px;
    min-width: 0;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .nav-link {
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    padding: 6px 10px;
    border-radius: 6px;
    white-space: nowrap;
    transition: color 0.15s, background 0.15s;
  }

  .navbar.dark .nav-link {
    color: #84b9d5;
  }

  .navbar.dark .nav-link:hover,
  .navbar.dark .nav-link.active {
    color: #fff;
    background: rgba(73, 182, 234, 0.12);
  }

  .navbar.light .nav-link {
    color: #555;
  }

  .navbar.light .nav-link:hover,
  .navbar.light .nav-link.active {
    color: #e84c3d;
  }

  .nav-muted {
    font-size: 13px;
    color: #4d7a9e;
    padding: 0 6px;
  }

  .user-chip {
    font-size: 12px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 20px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navbar.dark .user-chip {
    background: rgba(73, 182, 234, 0.12);
    color: #49b6ea;
    border: 1px solid rgba(73, 182, 234, 0.25);
  }

  .navbar.light .user-chip {
    background: #f5f5f5;
    color: #555;
    border: 1px solid #eee;
  }

  .btn {
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 6px;
    text-decoration: none;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    transition: opacity 0.15s;
  }

  .btn-outline {
    background: transparent;
  }

  .navbar.dark .btn-outline {
    border: 1px solid rgba(73, 182, 234, 0.3);
    color: #84b9d5;
  }

  .navbar.dark .btn-outline:hover {
    border-color: #49b6ea;
    color: #fff;
  }

  .navbar.light .btn-outline {
    border: 1px solid #ddd;
    color: #555;
  }

  .btn-primary {
    color: white;
    border: none;
  }

  .navbar.dark .btn-primary {
    background: #3b82f6;
  }

  .navbar.dark .btn-primary:hover {
    background: #2563eb;
  }

  .navbar.light .btn-primary {
    background: #e84c3d;
  }

  .navbar.light .btn-primary:hover {
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    .navbar {
      flex-wrap: wrap;
      height: auto;
      min-height: 60px;
      padding: 0.75rem 1rem;
    }

    .center {
      order: 3;
      flex: 1 1 100%;
      max-width: none;
    }

    .nav-links {
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .user-chip {
      display: none;
    }

    .nav-link {
      font-size: 12px;
      padding: 5px 8px;
    }

    .btn {
      font-size: 12px;
      padding: 6px 10px;
    }
  }
</style>
