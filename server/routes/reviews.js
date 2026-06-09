import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
}

/** GET /api/reviews/shop/:shopId — list reviews + summary */
router.get('/shop/:shopId', async (req, res) => {
  const { shopId } = req.params
  const limit = Math.min(Number(req.query.limit) || 50, 100)

  const { data: reviews, error } = await getSupabase()
    .from('reviews')
    .select('id, shop_id, order_id, user_id, user_name, rating, body, created_at')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return res.status(500).json({ error: error.message })

  const count = reviews?.length ?? 0
  const avg =
    count > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / count
      : 0

  res.json({
    reviews: reviews ?? [],
    summary: {
      average: Math.round(avg * 10) / 10,
      count
    }
  })
})

/** POST /api/reviews — submit a review (requires prior order from shop) */
router.post('/', async (req, res) => {
  const { shop_id, order_id, user_id, user_name, rating, body } = req.body

  if (!shop_id || !user_name?.trim()) {
    return res.status(400).json({ error: 'Shop and reviewer name are required.' })
  }

  const stars = Number(rating)
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
  }

  const supabase = getSupabase()

  if (order_id && user_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, shop_id, user_id, status')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) return res.status(400).json({ error: 'Order not found.' })
    if (order.shop_id !== shop_id) {
      return res.status(400).json({ error: 'Order does not belong to this shop.' })
    }
    if (order.user_id && order.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only review your own orders.' })
    }
    if (!['confirmed', 'shipped', 'completed', 'paid'].includes(order.status)) {
      return res.status(400).json({ error: 'You can review after the shop confirms your order.' })
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) return res.status(409).json({ error: 'You already reviewed this order.' })
  } else if (user_id) {
    const { data: priorOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('shop_id', shop_id)
      .eq('user_id', user_id)
      .in('status', ['confirmed', 'shipped', 'completed', 'paid'])
      .limit(1)
      .maybeSingle()

    if (!priorOrder) {
      return res.status(400).json({ error: 'Purchase from this shop before leaving a review.' })
    }
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        shop_id,
        order_id: order_id || null,
        user_id: user_id || null,
        user_name: user_name.trim(),
        rating: stars,
        body: body?.trim() || null
      }
    ])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You already reviewed this order.' })
    }
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

export default router
