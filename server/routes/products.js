import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
}

function buildListingPayload(body) {
  const {
    shop_id,
    name,
    price,
    description,
    highlights,
    listing_type,
    industry,
    subcategory,
    image_data,
    image_name,
    details
  } = body

  return {
    shop_id,
    name: name?.trim(),
    price: Number(price) || 0,
    description: description?.trim() || '',
    highlights: highlights?.trim() || null,
    listing_type: listing_type === 'service' ? 'service' : 'product',
    industry: industry || null,
    subcategory: subcategory || null,
    image_data: image_data || null,
    image_name: image_name?.trim() || null,
    details: details && typeof details === 'object' ? details : {}
  }
}

router.get('/shop/:shopId', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .eq('shop_id', req.params.shopId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const payload = buildListingPayload(req.body)

  if (!payload.shop_id || !payload.name) {
    return res.status(400).json({ error: 'Shop ID and listing name are required.' })
  }

  const { data, error } = await getSupabase().from('products').insert([payload]).select().single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.patch('/:id', async (req, res) => {
  const { shop_id: _shopId, ...rest } = req.body
  const payload = buildListingPayload({ ...rest, shop_id: 'keep' })
  delete payload.shop_id

  const { data, error } = await getSupabase()
    .from('products')
    .update(payload)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { error } = await getSupabase().from('products').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
