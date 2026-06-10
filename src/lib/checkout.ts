import type { CartItem } from './cart'

export type DeliveryMethod = 'delivery' | 'pickup'
export type PaymentMethod = 'cod' | 'gcash' | 'maya' | 'card'

export interface CheckoutPayload {
  shop_id: string
  shop_name: string
  items: CartItem[]
  customer_note?: string
  user_id?: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  shipping_address?: string
  delivery_method: DeliveryMethod
  payment_method: PaymentMethod
  tracking_consent: boolean
}

export interface OrderRecord {
  id: string
  shop_id: string
  shop_name: string | null
  items: Array<{ product_id: string; name: string; price: number; quantity: number }>
  subtotal: number
  shipping_fee: number
  total: number
  status: string
  payment_method: string
  payment_status: string
  delivery_method: string
  customer_name: string | null
  customer_phone: string | null
  shipping_address: string | null
  customer_note: string | null
  user_id: string | null
  created_at: string
  tracking_enabled?: boolean
  tracked_by?: 'customer' | 'driver' | null
  tracker_lat?: number | null
  tracker_lng?: number | null
  tracker_updated_at?: string | null
  tracking_consent_at?: string | null
}

export const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod
  label: string
  desc: string
  icon: string
}> = [
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '💵' },
  { id: 'gcash', label: 'GCash', desc: 'Pay instantly via GCash wallet', icon: '📱' },
  { id: 'maya', label: 'Maya', desc: 'Pay instantly via Maya wallet', icon: '💳' },
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, and local cards', icon: '🏦' }
]

export async function submitCheckout(payload: CheckoutPayload): Promise<OrderRecord> {
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
      customer_note: payload.customer_note,
      user_id: payload.user_id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      shipping_address: payload.shipping_address,
      delivery_method: payload.delivery_method,
      payment_method: payload.payment_method,
      tracking_consent: payload.tracking_consent
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Checkout failed')
  return data
}

export async function fetchUserOrders(userId: string): Promise<OrderRecord[]> {
  const res = await fetch(`/api/orders?user_id=${encodeURIComponent(userId)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load orders')
  return data
}

export async function fetchShopOrders(shopId: string): Promise<OrderRecord[]> {
  const res = await fetch(`/api/orders?shop_id=${encodeURIComponent(shopId)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load orders')
  return data
}

export async function updateOrderStatus(orderId: string, status: string): Promise<OrderRecord> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update order')
  return data
}

export function paymentLabel(method: string): string {
  return PAYMENT_OPTIONS.find((p) => p.id === method)?.label ?? method
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return map[status] ?? status
}
