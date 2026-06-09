<script lang="ts">
  import { onMount } from 'svelte'
  import { getUser } from '$lib/auth'
  import { fetchUserOrders, type OrderRecord } from '$lib/checkout'
  import {
    fetchShopReviews,
    submitReview,
    formatReviewDate,
    starsDisplay,
    ratingBreakdown,
    type Review,
    type ReviewSummary
  } from '$lib/reviews'
  import { loginUrl } from '$lib/navigation'
  import type { User } from '@supabase/supabase-js'

  interface Props {
    shopId: string
    shopName: string
    onSummary?: (summary: ReviewSummary) => void
  }

  let { shopId, shopName, onSummary }: Props = $props()

  let reviews = $state<Review[]>([])
  let summary = $state<ReviewSummary>({ average: 0, count: 0 })
  let loading = $state(true)
  let error = $state('')

  let user = $state<User | null>(null)
  let reviewableOrders = $state<OrderRecord[]>([])
  let selectedOrderId = $state('')
  let rating = $state(5)
  let body = $state('')
  let submitting = $state(false)
  let submitError = $state('')
  let submitSuccess = $state(false)

  let breakdown = $derived(ratingBreakdown(reviews))

  onMount(async () => {
    user = await getUser()
    await loadReviews()
    if (user) await loadReviewableOrders()
  })

  async function loadReviews() {
    loading = true
    error = ''
    try {
      const data = await fetchShopReviews(shopId)
      reviews = data.reviews
      summary = data.summary
      onSummary?.(data.summary)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not load reviews'
    } finally {
      loading = false
    }
  }

  async function loadReviewableOrders() {
    if (!user) return
    try {
      const orders = await fetchUserOrders(user.id)
      const reviewedOrderIds = new Set(reviews.filter((r) => r.order_id).map((r) => r.order_id))
      reviewableOrders = orders.filter(
        (o) =>
          o.shop_id === shopId &&
          ['confirmed', 'shipped', 'completed', 'paid'].includes(o.status) &&
          !reviewedOrderIds.has(o.id)
      )
      if (reviewableOrders.length && !selectedOrderId) {
        selectedOrderId = reviewableOrders[0].id
      }
    } catch {
      reviewableOrders = []
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (!user) return
    submitting = true
    submitError = ''
    submitSuccess = false
    try {
      const displayName =
        (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null) ??
        user.email?.split('@')[0] ??
        'Buyer'
      await submitReview({
        shop_id: shopId,
        order_id: selectedOrderId || undefined,
        user_id: user.id,
        user_name: displayName,
        rating,
        body: body.trim() || undefined
      })
      submitSuccess = true
      body = ''
      rating = 5
      await loadReviews()
      await loadReviewableOrders()
    } catch (e) {
      submitError = e instanceof Error ? e.message : 'Could not submit review'
    } finally {
      submitting = false
    }
  }
</script>

<section class="reviews-section" id="reviews">
  <div class="section-head">
    <h2>Customer reviews</h2>
    {#if summary.count > 0}
      <p class="head-sub">{summary.count} review{summary.count === 1 ? '' : 's'} for {shopName}</p>
    {/if}
  </div>

  {#if loading}
    <div class="loading">Loading reviews…</div>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="summary-panel">
      <div class="score-block">
        <span class="big-score">{summary.count ? summary.average.toFixed(1) : '—'}</span>
        <span class="big-stars">{starsDisplay(summary.average || 0)}</span>
        <span class="score-count">{summary.count} rating{summary.count === 1 ? '' : 's'}</span>
      </div>
      <div class="bars">
        {#each [5, 4, 3, 2, 1] as star (star)}
          {@const count = breakdown[star] ?? 0}
          {@const pct = summary.count ? (count / summary.count) * 100 : 0}
          <div class="bar-row">
            <span class="bar-label">{star}★</span>
            <div class="bar-track"><div class="bar-fill" style="width: {pct}%"></div></div>
            <span class="bar-num">{count}</span>
          </div>
        {/each}
      </div>
    </div>

    {#if user}
      {#if reviewableOrders.length}
        <form class="review-form" onsubmit={handleSubmit}>
          <h3>Write a review</h3>
          <p class="form-hint">Share your experience after your order from {shopName}.</p>

          {#if reviewableOrders.length > 1}
            <label class="field">
              Order
              <select bind:value={selectedOrderId}>
                {#each reviewableOrders as order (order.id)}
                  <option value={order.id}>
                    Order #{order.id.slice(0, 8)} · ₱{Number(order.total).toLocaleString()} · {formatReviewDate(order.created_at)}
                  </option>
                {/each}
              </select>
            </label>
          {/if}

          <div class="stars-input" role="group" aria-label="Rating">
            {#each [1, 2, 3, 4, 5] as star (star)}
              <button
                type="button"
                class="star-btn"
                class:active={star <= rating}
                onclick={() => (rating = star)}
                aria-label="{star} star{star === 1 ? '' : 's'}"
              >
                ★
              </button>
            {/each}
          </div>

          <label class="field">
            Your review
            <textarea bind:value={body} rows="3" placeholder="What did you like? How was the product and service?"></textarea>
          </label>

          {#if submitError}<p class="error">{submitError}</p>{/if}
          {#if submitSuccess}<p class="success">Thanks! Your review was posted.</p>{/if}

          <button type="submit" class="submit-btn" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post review'}
          </button>
        </form>
      {:else if summary.count === 0}
        <p class="no-review-hint">Order from this shop to leave the first review.</p>
      {/if}
    {:else}
      <p class="login-hint">
        <a href={loginUrl(`/shops/${shopId}#reviews`)}>Sign in</a> to leave a review after you purchase.
      </p>
    {/if}

    <div class="review-list">
      {#if reviews.length === 0}
        <p class="empty">No reviews yet. Be the first to share your experience!</p>
      {:else}
        {#each reviews as review (review.id)}
          <article class="review-card">
            <div class="review-head">
              <div class="avatar">{review.user_name.charAt(0).toUpperCase()}</div>
              <div class="review-meta">
                <strong>{review.user_name}</strong>
                <span class="review-stars">{starsDisplay(review.rating)}</span>
                <time datetime={review.created_at}>{formatReviewDate(review.created_at)}</time>
              </div>
            </div>
            {#if review.body}
              <p class="review-body">{review.body}</p>
            {/if}
          </article>
        {/each}
      {/if}
    </div>
  {/if}
</section>

<style>
  .reviews-section {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 1px solid var(--border);
  }

  .section-head {
    margin-bottom: 20px;
  }

  h2 {
    margin: 0 0 4px;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-dark);
  }

  .head-sub {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .loading, .empty, .no-review-hint, .login-hint {
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
    padding: 24px;
    background: var(--bg-card);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
  }

  .login-hint a {
    color: var(--budol-orange);
    font-weight: 600;
  }

  .summary-panel {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    padding: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 560px) {
    .summary-panel {
      grid-template-columns: 1fr;
    }
  }

  .score-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    text-align: center;
  }

  .big-score {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--budol-orange);
    line-height: 1;
  }

  .big-stars {
    color: #f5a623;
    font-size: 18px;
    letter-spacing: -1px;
    margin: 6px 0;
  }

  .score-count {
    font-size: 12px;
    color: var(--text-muted);
  }

  .bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
    justify-content: center;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 28px 1fr 24px;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .bar-label {
    color: var(--text-muted);
    font-weight: 600;
  }

  .bar-track {
    height: 8px;
    background: var(--bg);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--budol-orange);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .bar-num {
    text-align: right;
    color: var(--text-muted);
    font-size: 11px;
  }

  .review-form {
    padding: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: 20px;
  }

  .review-form h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
  }

  .form-hint {
    margin: 0 0 14px;
    font-size: 13px;
    color: var(--text-muted);
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
    margin-bottom: 12px;
  }

  .field select,
  .field textarea {
    padding: 10px 12px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--bg-inset);
    color: var(--text-dark);
    font-family: inherit;
    font-size: 14px;
    text-transform: none;
    letter-spacing: normal;
    font-weight: 400;
  }

  .stars-input {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
  }

  .star-btn {
    border: none;
    background: none;
    font-size: 28px;
    color: var(--border-strong);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.15s, transform 0.1s;
  }

  .star-btn.active {
    color: #f5a623;
  }

  .star-btn:hover {
    transform: scale(1.1);
  }

  .submit-btn {
    padding: 10px 20px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--budol-orange);
    color: white;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .review-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .review-card {
    padding: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .review-head {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--budol-orange);
    font-weight: 800;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .review-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .review-meta strong {
    font-size: 14px;
    color: var(--text-dark);
  }

  .review-stars {
    color: #f5a623;
    font-size: 13px;
    letter-spacing: -1px;
  }

  .review-meta time {
    font-size: 11px;
    color: var(--text-muted);
  }

  .review-body {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-dark);
    padding-left: 52px;
  }

  @media (max-width: 560px) {
    .review-body {
      padding-left: 0;
    }
  }

  .error {
    color: var(--alert-red);
    font-size: 13px;
    margin: 0 0 8px;
  }

  .success {
    color: var(--success);
    font-size: 13px;
    margin: 0 0 8px;
  }
</style>
