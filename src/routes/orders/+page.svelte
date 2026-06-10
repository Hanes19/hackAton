<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import NavBar from '$lib/NavBar.svelte'
  import { getUser } from '$lib/auth'
  import { loginUrl } from '$lib/navigation'
  import { fetchUserOrders, paymentLabel, statusLabel, type OrderRecord } from '$lib/checkout'
  import type { User } from '@supabase/supabase-js'

  let user = $state<User | null>(null)
  let orders = $state<OrderRecord[]>([])
  let loading = $state(true)
  let error = $state('')

  onMount(async () => {
    user = await getUser()
    if (!user) {
      goto(loginUrl('/orders'))
      return
    }
    try {
      orders = await fetchUserOrders(user.id)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load orders'
    } finally {
      loading = false
    }
  })

  function canReview(order: OrderRecord): boolean {
    return ['confirmed', 'shipped', 'completed', 'paid'].includes(order.status)
  }

  function canTrack(order: OrderRecord): boolean {
    return order.status !== 'cancelled'
  }
</script>

<svelte:head>
  <title>My orders — Budol Map</title>
</svelte:head>

<div class="orders-page">
  <NavBar variant="light" />

  <main class="main">
    <h1>My orders</h1>
    <p class="lead">Track purchases and leave reviews after the seller confirms your order.</p>

    {#if loading}
      <div class="state"><span class="spinner"></span> Loading orders…</div>
    {:else if error}
      <p class="error">{error}</p>
    {:else if orders.length === 0}
      <div class="empty">
        <span class="empty-icon">🛒</span>
        <p>No orders yet.</p>
        <a href="/map" class="link-btn">Browse shops on the map</a>
      </div>
    {:else}
      <div class="order-list">
        {#each orders as order (order.id)}
          <article class="order-card">
            <div class="order-head">
              <div>
                <strong>{order.shop_name ?? 'Shop'}</strong>
                <span class="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <span class="status" class:done={order.status === 'completed'}>{statusLabel(order.status)}</span>
            </div>

            <ul class="items">
              {#each order.items as item, i (i)}
                <li>{item.quantity}× {item.name} · ₱{(item.price * item.quantity).toLocaleString()}</li>
              {/each}
            </ul>

            <div class="order-meta">
              <span>{paymentLabel(order.payment_method)} · {order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              <strong>₱{Number(order.total).toLocaleString()}</strong>
            </div>

            <div class="order-foot">
              <time>{new Date(order.created_at).toLocaleString('en-PH')}</time>
              <div class="actions">
                {#if canTrack(order)}
                  <a href="/orders/{order.id}/track" class="small-btn primary">Track</a>
                {/if}
                <a href="/shops/{order.shop_id}" class="small-btn">View shop</a>
                {#if canReview(order)}
                  <a href="/shops/{order.shop_id}#reviews" class="small-btn">Leave review</a>
                {/if}
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .orders-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-sans);
  }

  .main {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 20px 64px;
  }

  h1 {
    margin: 0 0 6px;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .lead {
    margin: 0 0 24px;
    font-size: 14px;
    color: var(--text-muted);
  }

  .state {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    padding: 40px;
    justify-content: center;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-top-color: var(--budol-orange);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty {
    text-align: center;
    padding: 48px 24px;
    background: var(--bg-card);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
  }

  .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }

  .link-btn {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 20px;
    background: var(--budol-orange);
    color: white;
    border-radius: var(--radius-pill);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
  }

  .order-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .order-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px;
    box-shadow: var(--shadow-sm);
  }

  .order-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
  }

  .order-head strong {
    display: block;
    font-size: 15px;
    color: var(--text-dark);
  }

  .order-id {
    font-size: 11px;
    color: var(--text-muted);
    font-family: monospace;
  }

  .status {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--primary-light);
    color: var(--budol-orange);
    flex-shrink: 0;
  }

  .status.done {
    background: var(--success-bg);
    color: var(--success);
  }

  .items {
    margin: 0 0 10px;
    padding: 0 0 0 16px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .order-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--text-muted);
    padding: 10px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }

  .order-meta strong {
    font-size: 16px;
    color: var(--budol-orange);
  }

  .order-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .order-foot time {
    font-size: 11px;
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .small-btn {
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid var(--border-strong);
    color: var(--text-dark);
  }

  .small-btn.primary {
    background: var(--budol-orange);
    border-color: var(--budol-orange);
    color: white;
  }

  .error {
    color: var(--alert-red);
  }
</style>
