export type BusinessType = 'product' | 'service'

export interface ListingPayload {
  name: string
  price: number
  description: string
  highlights?: string
  listing_type?: BusinessType
  industry?: string
  subcategory?: string
  image_data?: string
  image_name?: string
  details?: Record<string, string>
}

export interface SellerProduct {
  id: string
  shop_id: string
  name: string
  price: number
  description: string
  highlights?: string | null
  listing_type?: string | null
  industry?: string | null
  subcategory?: string | null
  image_data?: string | null
  image_name?: string | null
  details?: Record<string, string> | null
}

export interface SellerShop {
  id: string
  name: string
  description: string
  category: string
  address: string
  lat: number
  lng: number
  business_type: BusinessType | null
  shop_setup_complete: boolean | null
  verification_status: string | null
  owner_name?: string
  lgu_municipality?: string
  products?: SellerProduct[]
}

export async function fetchMyShop(userId: string): Promise<SellerShop | null> {
  const res = await fetch(`/api/shops/user/${userId}`)
  if (res.status === 404) return null
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function updateShop(
  shopId: string,
  payload: Partial<
    Pick<SellerShop, 'name' | 'description' | 'category' | 'address' | 'lat' | 'lng' | 'business_type' | 'shop_setup_complete'>
  >
): Promise<SellerShop> {
  const res = await fetch(`/api/shops/${shopId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update shop')
  return data
}

export async function addListing(shopId: string, listing: ListingPayload): Promise<SellerProduct> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shop_id: shopId, ...listing })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to add listing')
  return data
}

export async function updateListing(productId: string, listing: ListingPayload): Promise<SellerProduct> {
  const res = await fetch(`/api/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listing)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update listing')
  return data
}

export async function deleteListing(productId: string): Promise<void> {
  const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete listing')
  }
}
