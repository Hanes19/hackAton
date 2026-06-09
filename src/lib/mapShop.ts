export interface MapProduct {
  id: string
  name: string
  price: number
  image_data?: string | null
  listing_type?: string | null
  subcategory?: string | null
  highlights?: string | null
  description?: string
}

export interface MapShop {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  address: string
  description: string
  business_type?: string | null
  products?: MapProduct[]
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string | null
}

export function shopRating(shopId: string): number {
  let hash = 0
  for (let i = 0; i < shopId.length; i++) hash = (hash + shopId.charCodeAt(i) * (i + 1)) % 997
  return 3.8 + (hash % 12) / 10
}

export function shopReviewCount(shopId: string): number {
  let hash = 0
  for (let i = 0; i < shopId.length; i++) hash = (hash + shopId.charCodeAt(i)) % 500
  return 12 + (hash % 180)
}

export function priceRange(products: MapProduct[] | undefined): string {
  if (!products?.length) return '₱ —'
  const prices = products.map((p) => Number(p.price)).filter((p) => p > 0)
  if (!prices.length) return '₱ —'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return `₱${min.toLocaleString()}`
  return `₱${min.toLocaleString()}–${max.toLocaleString()}`
}

export function shopThumbnail(shop: MapShop): string {
  const first = shop.products?.find((p) => p.image_data)
  if (first?.image_data) return first.image_data
  return `https://picsum.photos/seed/${shop.id}/120/120`
}

/** Demo flag for time-sensitive offers (hash-based until real promos exist). */
export function hasFlashDeal(shopId: string): boolean {
  let hash = 0
  for (let i = 0; i < shopId.length; i++) hash = (hash + shopId.charCodeAt(i) * 3) % 997
  return hash % 5 === 0
}

export function isOpenNow(shopId: string): boolean {
  const hour = new Date().getHours()
  let hash = 0
  for (let i = 0; i < shopId.length; i++) hash += shopId.charCodeAt(i)
  const opensEarly = hash % 2 === 0
  if (opensEarly) return hour >= 8 && hour < 21
  return hour >= 10 && hour < 22
}

export async function fetchShopDetail(id: string): Promise<MapShop> {
  const res = await fetch(`/api/shops/${id}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load shop')
  return data
}

export async function placeOrder(payload: {
  shop_id: string
  shop_name: string
  items: CartItem[]
  total: number
  customer_note?: string
}) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop_id: payload.shop_id,
      shop_name: payload.shop_name,
      items: payload.items.map((i) => ({
        product_id: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity
      })),
      total: payload.total,
      customer_note: payload.customer_note
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Order failed')
  return data
}
