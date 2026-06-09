import express from 'express'
import { BUKIDNON_LGUS, verifyBusinessPermit } from '../lib/lguRegistry.js'

const router = express.Router()

router.get('/municipalities', (_req, res) => {
  res.json(BUKIDNON_LGUS)
})

router.post('/verify-permit', (req, res) => {
  const { permitNumber, ownerName, municipality } = req.body

  if (!permitNumber?.trim() || !ownerName?.trim() || !municipality?.trim()) {
    return res.status(400).json({
      verified: false,
      code: 'MISSING_FIELDS',
      message: 'Permit number, owner name, and LGU municipality are required.'
    })
  }

  const result = verifyBusinessPermit({ permitNumber, ownerName, municipality })
  res.json(result)
})

export default router
