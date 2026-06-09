import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  // FIXED: Tell the backend to use the PUBLIC_ variables
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  return createClient(url, key)
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
  const { name, description, category, lat, lng, address, user_id } = req.body
  const { data, error } = await getSupabase()
    .from('shops')
    .insert([{ name, description, category, lat, lng, address, user_id }])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

export default router