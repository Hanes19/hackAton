<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import NavBar from '$lib/NavBar.svelte'
  import TrackingMap from '$lib/TrackingMap.svelte'
  import LocationShare from '$lib/LocationShare.svelte'
  import { getUser } from '$lib/auth'
  import { loginUrl } from '$lib/navigation'
  import { statusLabel, paymentLabel } from '$lib/checkout'
  import {
    fetchOrder,
    customerShouldShare,
    customerCanWatch,
    trackingStatusLabel,
    type OrderWithTracking
  } from '$lib/orderTracking'
  import type { User } from '@supabase/supabase-js'

  let user = $state<User | null>(null)
  let order = $state<OrderWithTracking | null>(null)
  let loading = $state(true)
  let error = $state('')
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const orderId = $derived($page.params.id)

  async function refresh(silent = false) {
    if (!orderId) return
    if (!silent) loading = true
    try {
      order = await fetchOrder(orderId)
      error = ''
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load order'
    } finally {
      if (!silent) loading = false
    }
  }

  onMount(async () => {
    user = await getUser()
    if (!user) {
      goto(loginUrl(`/orders/${orderId}/track`))
      return
    }
    await refresh()
    pollTimer = setInterval(() => void refresh(true), 10000)
  })

  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer)
  })

  function handleLocalUpdate(lat: number, lng: number) {
    if (order) {
      order = { ...order, tracker_lat: lat, tracker_lng: lng, tracker_updated_at: new Date().toISOString() }
    }
  }
</script>

<svelte:head>
  <title>Track order — Budol Map</title>
</svelte:head>

<div class="track-page">
  <NavBar variant="light" />

  <main class="main">
    <a href="/orders" class="back">← My orders</a>

    {#if loading}
      <p class="muted">Loading tracking…</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if order}
      <header class="head">
        <div>
          <h1>{order.shop_name ?? 'Order'}</h1>
          <p class="meta">
            #{order.id.slice(0, 8).toUpperCase()} · {statusLabel(order.status)} ·
            {order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}
          </p>
        </div>
      </header>

      <section class="panel">
        <div class="status-row">
          <span class="status-dot" class:live={order.tracking_enabled}></span>
          <div>
            <strong>{trackingStatusLabel(order)}</strong>
            {#if order.tracker_updated_at}
              <p class="updated">Updated {new Date(order.tracker_updated_at).toLocaleTimeString('en-PH')}</p>
            {/if}
          </div>
        </div>

        <TrackingMap
          shopLat={order.shop_lat}
          shopLng={order.shop_lng}
          shopName={order.shop_name ?? 'Shop'}
          trackerLat={order.tracker_lat}
          trackerLng={order.tracker_lng}
          trackerLabel={order.tracked_by === 'driver' ? 'Driver' : 'You'}
        />

        {#if customerShouldShare(order)}
          <div class="share-block">
            <h2>Share your location</h2>
            <p>
              For pickup orders, Budol Map tracks <strong>you</strong> (not the shop) while you head to
              collect your order. This helps the seller prepare and reduces fake bookings.
            </p>
            <LocationShare
              orderId={order.id}
              role="customer"
              label="Share my location on the way"
              onUpdate={handleLocalUpdate}
            />
          </div>
        {:else if customerCanWatch(order)}
          <div class="watch-block">
            <h2>Driver on the way</h2>
            <p>
              Your delivery is in progress. The driver’s live location appears on the map above when they
              share it from their device.
            </p>
            {#if order.tracker_lat == null}
              <p class="waiting">Waiting for driver to start sharing location…</p>
            {/if}
          </div>
        {:else if order.tracking_enabled}
          <p class="muted">Live tracking will begin when the seller updates your order status.</p>
        {:else if ['completed', 'cancelled'].includes(order.status)}
          <p class="muted">Tracking has ended for this order.</p>
        {:else}
          <p class="muted">
            {order.delivery_method === 'pickup'
              ? 'Tracking starts when the seller confirms your order and you head to the shop.'
              : 'Tracking starts when your order is marked out for delivery.'}
          </p>
        {/if}
      </section>

      <section class="panel details">
        <h2>Order details</h2>
        <ul>
          {#each order.items as item, i (i)}
            <li>{item.quantity}× {item.name}</li>
          {/each}
        </ul>
        <p>{paymentLabel(order.payment_method)} · ₱{Number(order.total).toLocaleString()}</p>
        {#if order.shipping_address}
          <p class="addr">📍 {order.shipping_address}</p>
        {/if}
      </section>

      <p class="legal-note">
        Location is shared only during active orders per our
        <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms</a>.
      </p>
    {/if}
  </main>
</div>

<style>
  .track-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-sans);
  }

  .main {
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 20px 64px;
  }

  .back {
    display: inline-block;
    margin-bottom: 16px;
    color: var(--budol-orange);
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
  }

  h1 {
    margin: 0 0 4px;
    font-size: 1.4rem;
  }

  .meta {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-top: 16px;
    box-shadow: var(--shadow-sm);
  }

  .status-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #dadce0;
    margin-top: 5px;
    flex-shrink: 0;
  }

  .status-dot.live {
    background: var(--success);
    animation: blink 1.5s infinite;
  }

  @keyframes blink {
    50% { opacity: 0.5; }
  }

  .updated {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--text-muted);
  }

  .share-block h2,
  .watch-block h2,
  .details h2 {
    margin: 16px 0 8px;
    font-size: 15px;
  }

  .share-block p,
  .watch-block p {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .waiting {
    font-size: 13px;
    color: var(--budol-orange);
    font-weight: 600;
  }

  .details ul {
    margin: 0 0 10px;
    padding-left: 18px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .addr {
    font-size: 13px;
    color: var(--text-muted);
  }

  .legal-note {
    margin-top: 20px;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .legal-note a {
    color: var(--budol-orange);
  }

  .muted { color: var(--text-muted); font-size: 14px; }
  .error { color: var(--alert-red); }
</style>
