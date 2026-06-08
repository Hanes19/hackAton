import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

// get all shops
router.get('/', async (req, res) => {
  const { data, error } = await getSupabase().from('shops').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// get one shop with its products
router.get('/:id', async (req, res) => {
  const { data, error } = await getSupabase()
    .from('shops')
    .select('*, products(*)')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// register a new shop
router.post('/', async (req, res) => {
  const { name, description, category, lat, lng, address } = req.body
  const { data, error } = await getSupabase()
    .from('shops')
    .insert([{ name, description, category, lat, lng, address }])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

export default router