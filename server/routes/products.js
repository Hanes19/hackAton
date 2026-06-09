import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
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
  const { shop_id, name, price, description } = req.body

  if (!shop_id || !name?.trim()) {
    return res.status(400).json({ error: 'Shop ID and listing name are required.' })
  }

  const { data, error } = await getSupabase()
    .from('products')
    .insert([
      {
        shop_id,
        name: name.trim(),
        price: Number(price) || 0,
        description: description?.trim() || ''
      }
    ])
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
