import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
}

const DELIVERY_FEE = 49
const FREE_DELIVERY_MIN = 500

function computeShipping(subtotal, deliveryMethod) {
  if (deliveryMethod === 'pickup') return 0
  if (subtotal >= FREE_DELIVERY_MIN) return 0
  return DELIVERY_FEE
}

async function validateAndPriceItems(supabase, shopId, items) {
  const productIds = items.map((i) => i.product_id).filter(Boolean)
  if (!productIds.length) return { error: 'Invalid cart items.' }

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, shop_id')
    .in('id', productIds)

  if (error) return { error: error.message }

  const byId = new Map((products ?? []).map((p) => [p.id, p]))
  let subtotal = 0
  const pricedItems = []

  for (const item of items) {
    const product = byId.get(item.product_id)
    if (!product || product.shop_id !== shopId) {
      return { error: `Product "${item.name || item.product_id}" is unavailable.` }
    }
    const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1))
    const price = Number(product.price)
    subtotal += price * qty
    pricedItems.push({
      product_id: product.id,
      name: product.name,
      price,
      quantity: qty
    })
  }

  return { subtotal, items: pricedItems }
}

/** GET /api/orders?shop_id=&user_id= */
router.get('/', async (req, res) => {
  const { shop_id, user_id } = req.query
  if (!shop_id && !user_id) {
    return res.status(400).json({ error: 'shop_id or user_id is required.' })
  }

  let query = getSupabase()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (shop_id) query = query.eq('shop_id', shop_id)
  if (user_id) query = query.eq('user_id', user_id)

  const { data, error } = await query.limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
})

/** POST /api/orders — create order with checkout details */
router.post('/', async (req, res) => {
  const {
    shop_id,
    shop_name,
    items,
    customer_note,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    delivery_method = 'delivery',
    payment_method = 'cod'
  } = req.body

  if (!shop_id || !items?.length) {
    return res.status(400).json({ error: 'Shop and at least one item are required.' })
  }

  if (!customer_name?.trim() || !customer_phone?.trim()) {
    return res.status(400).json({ error: 'Name and phone number are required.' })
  }

  if (delivery_method === 'delivery' && !shipping_address?.trim()) {
    return res.status(400).json({ error: 'Delivery address is required.' })
  }

  const supabase = getSupabase()
  const priced = await validateAndPriceItems(supabase, shop_id, items)
  if (priced.error) return res.status(400).json({ error: priced.error })

  const subtotal = priced.subtotal
  const shipping_fee = computeShipping(subtotal, delivery_method)
  const total = subtotal + shipping_fee

  const isDigitalPay = ['gcash', 'maya', 'card'].includes(payment_method)
  const payment_status = isDigitalPay ? 'paid' : 'pending'
  const status = isDigitalPay ? 'paid' : 'pending'

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        shop_id,
        shop_name: shop_name?.trim() || null,
        items: priced.items,
        subtotal,
        shipping_fee,
        total,
        customer_note: customer_note?.trim() || null,
        user_id: user_id || null,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone.trim(),
        shipping_address: shipping_address?.trim() || null,
        delivery_method,
        payment_method,
        payment_status,
        status
      }
    ])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

/** PATCH /api/orders/:id — update order status (seller/admin) */
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const allowed = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled', 'paid']
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` })
  }

  const { data, error } = await getSupabase()
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Order not found.' })
  res.json(data)
})

export default router
