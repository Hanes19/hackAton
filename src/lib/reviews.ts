export interface Review {
  id: string
  shop_id: string
  order_id: string | null
  user_id: string | null
  user_name: string
  rating: number
  body: string | null
  created_at: string
}

export interface ReviewSummary {
  average: number
  count: number
}

export interface ShopReviewsResponse {
  reviews: Review[]
  summary: ReviewSummary
}

export async function fetchShopReviews(shopId: string): Promise<ShopReviewsResponse> {
  const res = await fetch(`/api/reviews/shop/${shopId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load reviews')
  return data
}

export async function submitReview(payload: {
  shop_id: string
  order_id?: string
  user_id?: string
  user_name: string
  rating: number
  body?: string
}): Promise<Review> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to submit review')
  return data
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function starsDisplay(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
}

export function ratingBreakdown(reviews: Review[]): Record<number, number> {
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating)))
    counts[bucket] = (counts[bucket] ?? 0) + 1
  }
  return counts
}
