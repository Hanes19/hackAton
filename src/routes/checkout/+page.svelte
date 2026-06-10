<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import NavBar from '$lib/NavBar.svelte'
  import { getUser } from '$lib/auth'
  import {
    cartStore,
    clearCart,
    cartSubtotal,
    estimateShipping,
    FREE_DELIVERY_MIN,
    SHIPPING_FEE
  } from '$lib/cart'
  import {
    submitCheckout,
    PAYMENT_OPTIONS,
    type DeliveryMethod,
    type PaymentMethod,
    type OrderRecord
  } from '$lib/checkout'
  import { loginUrl } from '$lib/navigation'
  import type { User } from '@supabase/supabase-js'

  let user = $state<User | null>(null)
  let loading = $state(true)

  let cart = $derived($cartStore)

  let customerName = $state('')
  let customerEmail = $state('')
  let customerPhone = $state('')
  let shippingAddress = $state('')
  let customerNote = $state('')
  let deliveryMethod = $state<DeliveryMethod>('delivery')
  let paymentMethod = $state<PaymentMethod>('cod')
  let trackingConsent = $state(false)

  let submitting = $state(false)
  let paying = $state(false)
  let error = $state('')
  let placedOrder = $state<OrderRecord | null>(null)

  let subtotal = $derived($cartSubtotal)
  let shippingFee = $derived(estimateShipping(subtotal, deliveryMethod))
  let total = $derived(subtotal + shippingFee)
  let isDigitalPay = $derived(['gcash', 'maya', 'card'].includes(paymentMethod))

  onMount(async () => {
    if (!$cartStore?.items.length) {
      goto('/map')
      return
    }
    user = await getUser()
    if (!user) {
      goto(loginUrl('/checkout'))
      return
    }
    customerName =
      (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : '') || ''
    customerEmail = user.email ?? ''
    loading = false
  })

  async function placeOrder() {
    if (!cart || !user) return
    error = ''

    if (!customerName.trim() || !customerPhone.trim()) {
      error = 'Please enter your name and phone number.'
      return
    }
    if (deliveryMethod === 'delivery' && !shippingAddress.trim()) {
      error = 'Please enter your delivery address.'
      return
    }
    if (!trackingConsent) {
      error = 'Please agree to location tracking and our Terms & Privacy Policy.'
      return
    }

    submitting = true
    if (isDigitalPay) paying = true

    try {
      if (isDigitalPay) {
        await new Promise((r) => setTimeout(r, 1200))
      }

      const order = await submitCheckout({
        shop_id: cart.shopId,
        shop_name: cart.shopName,
        items: cart.items,
        customer_note: customerNote,
        user_id: user.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address: deliveryMethod === 'delivery' ? shippingAddress : undefined,
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        tracking_consent: trackingConsent
      })

      placedOrder = order
      clearCart()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Checkout failed'
    } finally {
      submitting = false
      paying = false
    }
  }
</script>

<svelte:head>
  <title>Checkout — Budol Map</title>
</svelte:head>

<div class="checkout-page">
  <NavBar variant="light" />

  {#if loading}
    <div class="state-wrap">
      <span class="spinner"></span>
      <p>Loading checkout…</p>
    </div>
  {:else if placedOrder}
    <div class="success-wrap">
      <div class="success-card">
        <span class="success-icon">✓</span>
        <h1>Order placed!</h1>
        <p class="order-id">Order #{placedOrder.id.slice(0, 8).toUpperCase()}</p>
        <p>
          Your order from <strong>{placedOrder.shop_name}</strong> is
          {isDigitalPay ? 'paid and' : ''} being processed.
          {deliveryMethod === 'pickup' ? 'Pick up at the shop when ready.' : 'The seller will arrange delivery.'}
        </p>
        <div class="success-total">
          <span>Total paid</span>
          <strong>₱{Number(placedOrder.total).toLocaleString()}</strong>
        </div>
        <div class="success-actions">
          <a href="/orders/{placedOrder.id}/track" class="btn primary">Track order</a>
          <a href="/orders" class="btn ghost">View all orders</a>
          <a href="/shops/{placedOrder.shop_id}#reviews" class="btn ghost">Back to shop</a>
        </div>
      </div>
    </div>
  {:else if cart}
    <div class="checkout-layout">
      <div class="checkout-main">
        <a href="/shops/{cart.shopId}" class="back-link">← Back to {cart.shopName}</a>
        <h1>Checkout</h1>

        <section class="panel">
          <h2>📍 Delivery address</h2>
          <div class="field-grid">
            <label class="field">
              Full name <span class="req">*</span>
              <input bind:value={customerName} placeholder="Juan dela Cruz" autocomplete="name" />
            </label>
            <label class="field">
              Phone <span class="req">*</span>
              <input bind:value={customerPhone} type="tel" placeholder="09XX XXX XXXX" autocomplete="tel" />
            </label>
            <label class="field full">
              Email
              <input bind:value={customerEmail} type="email" placeholder="you@email.com" autocomplete="email" />
            </label>
            <label class="field full">
              Delivery address {#if deliveryMethod === 'delivery'}<span class="req">*</span>{/if}
              <textarea
                bind:value={shippingAddress}
                rows="2"
                placeholder="Street, barangay, city, province"
                disabled={deliveryMethod === 'pickup'}
              ></textarea>
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>🚚 Delivery option</h2>
          <div class="option-cards">
            <button
              type="button"
              class="option-card"
              class:selected={deliveryMethod === 'delivery'}
              onclick={() => (deliveryMethod = 'delivery')}
            >
              <span class="option-icon">🛵</span>
              <div>
                <strong>Local delivery</strong>
                <span>{subtotal >= FREE_DELIVERY_MIN ? 'Free delivery' : `₱${SHIPPING_FEE} fee · Free over ₱${FREE_DELIVERY_MIN}`}</span>
              </div>
            </button>
            <button
              type="button"
              class="option-card"
              class:selected={deliveryMethod === 'pickup'}
              onclick={() => (deliveryMethod = 'pickup')}
            >
              <span class="option-icon">🏪</span>
              <div>
                <strong>Pickup at shop</strong>
                <span>Free · Collect in person</span>
              </div>
            </button>
          </div>
        </section>

        <section class="panel">
          <h2>💳 Payment method</h2>
          <div class="payment-list">
            {#each PAYMENT_OPTIONS as opt (opt.id)}
              <button
                type="button"
                class="payment-row"
                class:selected={paymentMethod === opt.id}
                onclick={() => (paymentMethod = opt.id)}
              >
                <span class="pay-icon">{opt.icon}</span>
                <div class="pay-info">
                  <strong>{opt.label}</strong>
                  <span>{opt.desc}</span>
                </div>
                <span class="radio" class:checked={paymentMethod === opt.id}></span>
              </button>
            {/each}
          </div>
          {#if isDigitalPay}
            <p class="pay-note">Demo mode: payment is simulated instantly — no real charge.</p>
          {/if}
        </section>

        <section class="panel">
          <h2>🛒 Order items</h2>
          <ul class="item-list">
            {#each cart.items as item (item.productId)}
              <li class="item-row">
                {#if item.image}
                  <img src={item.image} alt="" class="item-img" />
                {:else}
                  <div class="item-img placeholder">🍽</div>
                {/if}
                <div class="item-info">
                  <strong>{item.name}</strong>
                  <span>Qty: {item.quantity} × ₱{item.price.toLocaleString()}</span>
                </div>
                <strong class="item-total">₱{(item.price * item.quantity).toLocaleString()}</strong>
              </li>
            {/each}
          </ul>
          <label class="field">
            Note for seller
            <textarea bind:value={customerNote} rows="2" placeholder="Optional instructions…"></textarea>
          </label>
        </section>
      </div>

      <aside class="summary-panel">
        <h2>Order summary</h2>
        <p class="shop-name">{cart.shopName}</p>

        <div class="summary-lines">
          <div class="line">
            <span>Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          <div class="line">
            <span>Shipping</span>
            <span>{shippingFee === 0 ? 'Free' : `₱${shippingFee.toLocaleString()}`}</span>
          </div>
          <div class="line total">
            <span>Total</span>
            <strong>₱{total.toLocaleString()}</strong>
          </div>
        </div>

        {#if error}<p class="error">{error}</p>{/if}

        <label class="consent-box">
          <input type="checkbox" bind:checked={trackingConsent} />
          <span>
            I agree to order-scoped location tracking ({deliveryMethod === 'pickup'
              ? 'I share my location when heading to the shop'
              : 'the driver shares location during delivery'}) and accept the
            <a href="/terms" target="_blank" rel="noopener">Terms</a> and
            <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>, including rules against fake bookings.
          </span>
        </label>

        <button type="button" class="place-btn" disabled={submitting || !trackingConsent} onclick={placeOrder}>
          {#if paying}
            Processing payment…
          {:else if submitting}
            Placing order…
          {:else if isDigitalPay}
            Pay ₱{total.toLocaleString()}
          {:else}
            Place order · ₱{total.toLocaleString()}
          {/if}
        </button>

        <p class="secure-note">🔒 Your order is sent directly to the local seller on Budol Map.</p>
      </aside>
    </div>
  {/if}
</div>

<style>
  .checkout-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-sans);
  }

  .state-wrap, .success-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    min-height: calc(100vh - 56px);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--budol-orange);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .checkout-layout {
    max-width: 1080px;
    margin: 0 auto;
    padding: 24px 20px 64px;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 860px) {
    .checkout-layout {
      grid-template-columns: 1fr;
    }

    .summary-panel {
      position: static !important;
    }
  }

  .back-link {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    margin-bottom: 8px;
  }

  .back-link:hover { color: var(--budol-orange); }

  h1 {
    margin: 0 0 20px;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-dark);
  }

  .panel {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }

  .panel h2 {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-dark);
  }

  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .field.full { grid-column: 1 / -1; }

  @media (max-width: 520px) {
    .field-grid { grid-template-columns: 1fr; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .req { color: var(--budol-orange); }

  .field input,
  .field textarea {
    padding: 10px 12px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg-inset);
    color: var(--text-dark);
    font-size: 14px;
    font-family: inherit;
    text-transform: none;
    letter-spacing: normal;
    font-weight: 400;
  }

  .field input:disabled,
  .field textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 520px) {
    .option-cards { grid-template-columns: 1fr; }
  }

  .option-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-inset);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s;
  }

  .option-card.selected {
    border-color: var(--budol-orange);
    background: var(--primary-light);
  }

  .option-icon { font-size: 24px; }

  .option-card strong {
    display: block;
    font-size: 13px;
    color: var(--text-dark);
    margin-bottom: 2px;
  }

  .option-card span:last-child {
    font-size: 11px;
    color: var(--text-muted);
  }

  .payment-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .payment-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-inset);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    width: 100%;
    transition: border-color 0.15s;
  }

  .payment-row.selected {
    border-color: var(--budol-orange);
    background: var(--primary-light);
  }

  .pay-icon { font-size: 22px; }

  .pay-info {
    flex: 1;
    min-width: 0;
  }

  .pay-info strong {
    display: block;
    font-size: 13px;
    color: var(--text-dark);
  }

  .pay-info span {
    font-size: 11px;
    color: var(--text-muted);
  }

  .radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border-strong);
    flex-shrink: 0;
    position: relative;
  }

  .radio.checked {
    border-color: var(--budol-orange);
  }

  .radio.checked::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--budol-orange);
  }

  .pay-note {
    margin: 10px 0 0;
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
  }

  .item-list {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: var(--bg-inset);
    border-radius: var(--radius-sm);
  }

  .item-img {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  .item-img.placeholder {
    display: grid;
    place-items: center;
    background: var(--bg);
    font-size: 20px;
  }

  .item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-info strong {
    font-size: 13px;
    color: var(--text-dark);
  }

  .item-info span {
    font-size: 11px;
    color: var(--text-muted);
  }

  .item-total {
    font-size: 13px;
    color: var(--text-dark);
    white-space: nowrap;
  }

  .summary-panel {
    position: sticky;
    top: 72px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-md);
  }

  .summary-panel h2 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 800;
  }

  .shop-name {
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .summary-lines {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .line {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text-muted);
  }

  .line.total {
    font-size: 15px;
    color: var(--text-dark);
    padding-top: 8px;
  }

  .line.total strong {
    font-size: 20px;
    color: var(--budol-orange);
  }

  .place-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--budol-orange);
    color: white;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .place-btn:hover:not(:disabled) {
    background: var(--budol-orange-hover);
  }

  .place-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .secure-note {
    margin: 12px 0 0;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }

  .consent-box {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 12px 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
    cursor: pointer;
  }

  .consent-box input {
    margin-top: 3px;
    flex-shrink: 0;
    accent-color: var(--budol-orange);
  }

  .consent-box a {
    color: var(--budol-orange);
  }

  .error {
    color: var(--alert-red);
    font-size: 13px;
    margin: 0 0 10px;
  }

  .success-card {
    max-width: 440px;
    text-align: center;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 40px 32px;
    box-shadow: var(--shadow-lg);
  }

  .success-icon {
    display: inline-grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--success-bg);
    color: var(--success);
    font-size: 28px;
    margin-bottom: 16px;
  }

  .success-card h1 {
    margin: 0 0 8px;
    font-size: 1.5rem;
  }

  .order-id {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 12px;
    font-family: monospace;
  }

  .success-card p {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0 0 20px;
  }

  .success-total {
    display: flex;
    justify-content: space-between;
    padding: 14px;
    background: var(--bg);
    border-radius: var(--radius-sm);
    margin-bottom: 20px;
    font-size: 14px;
  }

  .success-total strong {
    color: var(--budol-orange);
    font-size: 18px;
  }

  .success-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    display: block;
    padding: 12px;
    border-radius: var(--radius-pill);
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;
    text-align: center;
  }

  .btn.primary {
    background: var(--budol-orange);
    color: white;
  }

  .btn.ghost {
    border: 1px solid var(--border-strong);
    color: var(--text-dark);
  }
</style>
