import type { OrderRecord } from './checkout'

export type TrackedBy = 'customer' | 'driver'

export interface OrderWithTracking extends OrderRecord {
  tracking_enabled?: boolean
  tracked_by?: TrackedBy | null
  tracker_lat?: number | null
  tracker_lng?: number | null
  tracker_updated_at?: string | null
  tracking_consent_at?: string | null
  shop_lat?: number | null
  shop_lng?: number | null
}

export interface TrackingPosition {
  lat: number
  lng: number
  updated_at?: string
}

/** Customer shares location when pickup is confirmed. */
export function customerShouldShare(order: OrderWithTracking): boolean {
  return !!order.tracking_enabled && order.tracked_by === 'customer'
}

/** Seller/driver shares location when delivery is out for delivery. */
export function driverShouldShare(order: OrderWithTracking): boolean {
  return !!order.tracking_enabled && order.tracked_by === 'driver'
}

/** Customer watches the driver during delivery. */
export function customerCanWatch(order: OrderWithTracking): boolean {
  return !!order.tracking_enabled && order.tracked_by === 'driver'
}

/** Seller watches the customer heading in for pickup. */
export function sellerCanWatch(order: OrderWithTracking): boolean {
  return !!order.tracking_enabled && order.tracked_by === 'customer'
}

export function trackingStatusLabel(order: OrderWithTracking): string {
  if (!order.tracking_enabled) {
    if (order.delivery_method === 'pickup' && order.status === 'confirmed') return 'Waiting for customer to share location'
    if (order.delivery_method === 'delivery' && order.status === 'shipped') return 'Waiting for driver location'
    return 'Tracking not active yet'
  }
  if (order.tracker_lat != null && order.tracker_lng != null) {
    const who = order.tracked_by === 'driver' ? 'Driver' : 'Customer'
    return `${who} location live`
  }
  return 'Waiting for location…'
}

export function nextStatusForOrder(order: OrderWithTracking): string | null {
  const flow =
    order.delivery_method === 'pickup'
      ? { pending: 'confirmed', paid: 'confirmed', confirmed: 'completed' }
      : { pending: 'confirmed', paid: 'confirmed', confirmed: 'shipped', shipped: 'completed' }
  return flow[order.status as keyof typeof flow] ?? null
}

export function advanceButtonLabel(order: OrderWithTracking): string {
  const next = nextStatusForOrder(order)
  if (!next) return ''
  if (next === 'confirmed') return 'Confirm order'
  if (next === 'shipped') return 'Out for delivery'
  if (next === 'completed') {
    return order.delivery_method === 'pickup' ? 'Mark picked up' : 'Mark delivered'
  }
  return 'Update'
}

export async function fetchOrder(orderId: string): Promise<OrderWithTracking> {
  const res = await fetch(`/api/orders/${orderId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load order')
  return data
}

export async function pushTrackingPosition(
  orderId: string,
  lat: number,
  lng: number,
  role: TrackedBy
): Promise<OrderWithTracking> {
  const res = await fetch(`/api/orders/${orderId}/tracking`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, role })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update location')
  return data
}
