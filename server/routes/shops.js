import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
}

const PUBLIC_SHOP_FIELDS =
  'id, name, description, category, lat, lng, address, created_at, verification_status, permit_verified, owner_name'

// get all shops (public: approved only; ?all=true for admin)
router.get('/', async (req, res) => {
  const showAll = req.query.all === 'true'
  let query = getSupabase().from('shops').select(showAll ? '*' : PUBLIC_SHOP_FIELDS)

  if (!showAll) {
    query = query.or('verification_status.eq.approved,verification_status.is.null')
  }

  const { data, error } = await query.order('created_at', { ascending: false })
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

// register a new shop (seller application with LGU + ID verification)
router.post('/', async (req, res) => {
  const {
    name,
    description,
    category,
    lat,
    lng,
    address,
    user_id,
    owner_name,
    permit_number,
    lgu_municipality,
    permit_verified,
    permit_business_name,
    id_type,
    id_number,
    id_document_data,
    id_document_name
  } = req.body

  if (!name?.trim() || !owner_name?.trim() || !permit_number?.trim() || !lgu_municipality?.trim()) {
    return res.status(400).json({
      error: 'Shop name, owner name, business permit number, and LGU municipality are required.'
    })
  }

  if (!permit_verified) {
    return res.status(400).json({
      error: 'Business permit must be verified with the LGU before submitting.'
    })
  }

  if (!id_type?.trim() || !id_number?.trim() || !id_document_data?.trim()) {
    return res.status(400).json({
      error: 'A valid government ID (type, number, and photo scan) is required.'
    })
  }

  const payload = {
    name: name.trim(),
    description: description?.trim() || '',
    category: category || 'Other',
    lat: lat ?? 7.9064,
    lng: lng ?? 125.0948,
    address: address?.trim() || '',
    user_id: user_id || null,
    owner_name: owner_name.trim(),
    permit_number: permit_number.trim().toUpperCase(),
    lgu_municipality: lgu_municipality.trim(),
    permit_verified: true,
    permit_business_name: permit_business_name?.trim() || null,
    id_type: id_type.trim(),
    id_number: id_number.trim(),
    id_document_data,
    id_document_name: id_document_name?.trim() || null,
    verification_status: 'pending',
    lgu_verified_at: new Date().toISOString()
  }

  const { data, error } = await getSupabase().from('shops').insert([payload]).select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

// admin: approve or reject seller application
router.patch('/:id/verification', async (req, res) => {
  const { status, rejection_reason } = req.body
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' })
  }

  const update = {
    verification_status: status,
    reviewed_at: new Date().toISOString()
  }
  if (status === 'rejected' && rejection_reason) {
    update.rejection_reason = rejection_reason
  }

  const { data, error } = await getSupabase()
    .from('shops')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
