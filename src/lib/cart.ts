import { browser } from '$app/environment'
import { writable, derived, get } from 'svelte/store'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string | null
}

export interface CartSession {
  shopId: string
  shopName: string
  items: CartItem[]
}

const STORAGE_KEY = 'budol_cart'

function loadStored(): CartSession | null {
  if (!browser) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartSession) : null
  } catch {
    return null
  }
}

function persist(value: CartSession | null) {
  if (!browser) return
  if (value?.items.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const cartStore = writable<CartSession | null>(loadStored())

cartStore.subscribe(persist)

export function getCart(): CartSession | null {
  return get(cartStore)
}

export const cartCount = derived(cartStore, ($c) =>
  $c?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
)

export const cartSubtotal = derived(cartStore, ($c) =>
  $c?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0
)

export function addToCart(
  shopId: string,
  shopName: string,
  item: Omit<CartItem, 'quantity'> & { quantity?: number }
): boolean {
  const session = get(cartStore)
  if (session && session.shopId !== shopId && session.items.length) {
    if (!confirm('Your cart has items from another shop. Replace cart with this item?')) return false
  }

  cartStore.update((current) => {
    let next =
      current && current.shopId === shopId
        ? current
        : { shopId, shopName, items: [] as CartItem[] }

    const qty = item.quantity ?? 1
    const existing = next.items.find((c) => c.productId === item.productId)
    if (existing) {
      next = {
        ...next,
        items: next.items.map((c) =>
          c.productId === item.productId ? { ...c, quantity: c.quantity + qty } : c
        )
      }
    } else {
      next = { ...next, items: [...next.items, { ...item, quantity: qty }] }
    }
    return next
  })
  return true
}

export function updateCartQty(productId: string, delta: number) {
  cartStore.update((current) => {
    if (!current) return null
    const items = current.items
      .map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + delta } : c))
      .filter((c) => c.quantity > 0)
    return items.length ? { ...current, items } : null
  })
}

export function clearCart() {
  cartStore.set(null)
}

export const SHIPPING_FEE = 49
export const FREE_DELIVERY_MIN = 500

export function estimateShipping(subtotal: number, deliveryMethod: 'delivery' | 'pickup'): number {
  if (deliveryMethod === 'pickup') return 0
  if (subtotal >= FREE_DELIVERY_MIN) return 0
  return SHIPPING_FEE
}
