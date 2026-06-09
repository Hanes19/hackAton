import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
}

router.post('/', async (req, res) => {
  const { shop_id, shop_name, items, total, customer_note } = req.body

  if (!shop_id || !items?.length) {
    return res.status(400).json({ error: 'Shop and at least one item are required.' })
  }

  const { data, error } = await getSupabase()
    .from('orders')
    .insert([
      {
        shop_id,
        shop_name: shop_name?.trim() || null,
        items,
        total: Number(total) || 0,
        customer_note: customer_note?.trim() || null,
        status: 'pending'
      }
    ])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
