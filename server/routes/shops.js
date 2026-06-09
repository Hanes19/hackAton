import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return createClient(url, key)
}

const PUBLIC_SHOP_FIELDS =
  'id, name, description, category, lat, lng, address, created_at, verification_status, permit_verified, owner_name, business_type, shop_setup_complete'

// get seller's shop by user id
router.get('/user/:userId', async (req, res) => {
  const { data: userShop, error: fetchError } = await getSupabase()
    .from('shops')
    .select('*, products(*)')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) return res.status(500).json({ error: fetchError.message })
  if (!userShop) return res.status(404).json({ error: 'No shop found for this user.' })
  res.json(userShop)
})

// get all shops (public: approved only; ?all=true for admin)
router.get('/', async (req, res) => {
  const showAll = req.query.all === 'true'
  const listFields = showAll
    ? '*'
    : `${PUBLIC_SHOP_FIELDS}, products(id, name, price, image_data, listing_type, subcategory, highlights)`

  let query = getSupabase().from('shops').select(listFields)

  if (!showAll) {
    query = query.or('verification_status.eq.approved,verification_status.is.null')
  }

  const { data: shops, error: fetchError } = await query.order('created_at', { ascending: false })
  if (fetchError) return res.status(500).json({ error: fetchError.message })
  res.json(shops)
})

// get one shop with its products
router.get('/:id', async (req, res) => {
  const { data: shop, error: fetchError } = await getSupabase()
    .from('shops')
    .select('*, products(*)')
    .eq('id', req.params.id)
    .single()
    
  if (fetchError) return res.status(500).json({ error: fetchError.message })
  res.json(shop)
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
    business_type: req.body.business_type === 'service' ? 'service' : 'product',
    shop_setup_complete: false,
    verification_status: 'pending',
    lgu_verified_at: new Date().toISOString()
  }

  const { data: newShop, error: insertError } = await getSupabase().from('shops').insert([payload]).select()
  if (insertError) return res.status(500).json({ error: insertError.message })
  res.json(newShop[0])
})

// seller: update shop profile / setup
router.patch('/:id', async (req, res) => {
  const allowed = [
    'name',
    'description',
    'category',
    'business_type',
    'address',
    'lat',
    'lng',
    'shop_setup_complete'
  ]

  const update = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key]
  }

  if (update.business_type && !['product', 'service'].includes(update.business_type)) {
    return res.status(400).json({ error: 'business_type must be product or service.' })
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' })
  }

  const { data: updatedShop, error: updateError } = await getSupabase()
    .from('shops')
    .update(update)
    .eq('id', req.params.id)
    .select('*, products(*)')
    .single()

  if (updateError) return res.status(500).json({ error: updateError.message })
  res.json(updatedShop)
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

  const { data: verifiedShop, error: verifyError } = await getSupabase()
    .from('shops')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single()

  if (verifyError) return res.status(500).json({ error: verifyError.message })
  res.json(verifiedShop)
})

export default router