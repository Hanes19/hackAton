/**
 * Mock LGU (Local Government Unit) business permit registry for Bukidnon.
 * In production this would connect to Valencia City / LGU e-Boss or similar APIs.
 */

export const BUKIDNON_LGUS = [
  { id: 'valencia', name: 'Valencia City', province: 'Bukidnon' },
  { id: 'malaybalay', name: 'Malaybalay City', province: 'Bukidnon' },
  { id: 'maramag', name: 'Maramag', province: 'Bukidnon' },
  { id: 'manolo', name: 'Manolo Fortich', province: 'Bukidnon' },
  { id: 'quezon', name: 'Quezon', province: 'Bukidnon' },
  { id: 'don_carlos', name: 'Don Carlos', province: 'Bukidnon' },
  { id: 'libona', name: 'Libona', province: 'Bukidnon' },
  { id: 'baungon', name: 'Baungon', province: 'Bukidnon' }
]

/** @type {Record<string, { ownerName: string, businessName: string, municipality: string, status: string, issued: string, expires: string }>} */
export const PERMIT_REGISTRY = {
  'VC-2024-001234': {
    ownerName: 'Juan dela Cruz',
    businessName: "Juan's Bakery",
    municipality: 'Valencia City',
    status: 'active',
    issued: '2024-01-15',
    expires: '2026-01-15'
  },
  'VC-2024-005678': {
    ownerName: 'Maria Santos',
    businessName: 'Bukidnon Crafts & Souvenirs',
    municipality: 'Valencia City',
    status: 'active',
    issued: '2024-03-20',
    expires: '2026-03-20'
  },
  'MB-2023-009912': {
    ownerName: 'Pedro Reyes',
    businessName: 'Highlands Coffee',
    municipality: 'Malaybalay City',
    status: 'active',
    issued: '2023-11-01',
    expires: '2025-11-01'
  },
  'MR-2024-003344': {
    ownerName: 'Ana Bautista',
    businessName: 'Maramag Fresh Produce',
    municipality: 'Maramag',
    status: 'active',
    issued: '2024-06-01',
    expires: '2026-06-01'
  },
  'MF-2022-007700': {
    ownerName: 'Ricardo Lim',
    businessName: 'Del Monte Pasalubong Center',
    municipality: 'Manolo Fortich',
    status: 'active',
    issued: '2022-08-10',
    expires: '2025-08-10'
  },
  'VC-2023-000111': {
    ownerName: 'Elena Gomez',
    businessName: 'Valencia Street Food Hub',
    municipality: 'Valencia City',
    status: 'expired',
    issued: '2023-01-01',
    expires: '2024-01-01'
  }
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function namesMatch(a, b) {
  return normalizeName(a) === normalizeName(b)
}

function municipalityMatch(registryMunicipality, selectedMunicipality) {
  const a = registryMunicipality.toLowerCase()
  const b = selectedMunicipality.toLowerCase()
  return a.includes(b) || b.includes(a.split(' ')[0])
}

/**
 * @param {{ permitNumber: string, ownerName: string, municipality: string }} input
 */
export function verifyBusinessPermit({ permitNumber, ownerName, municipality }) {
  const permit = PERMIT_REGISTRY[permitNumber.trim().toUpperCase()]

  if (!permit) {
    return {
      verified: false,
      code: 'PERMIT_NOT_FOUND',
      message:
        'Permit number not found in the LGU registry. Check the number on your Mayor\'s/Business Permit and try again.'
    }
  }

  if (permit.status === 'expired') {
    return {
      verified: false,
      code: 'PERMIT_EXPIRED',
      message: `Business permit expired on ${permit.expires}. Renew at your LGU before registering.`,
      permit: { ...permit, permitNumber: permitNumber.trim().toUpperCase() }
    }
  }

  if (!namesMatch(permit.ownerName, ownerName)) {
    return {
      verified: false,
      code: 'OWNER_MISMATCH',
      message:
        'Owner name does not match LGU records for this permit. Enter the name exactly as it appears on the permit.',
      permit: { businessName: permit.businessName, municipality: permit.municipality }
    }
  }

  if (!municipalityMatch(permit.municipality, municipality)) {
    return {
      verified: false,
      code: 'MUNICIPALITY_MISMATCH',
      message: `This permit was issued by ${permit.municipality}, not ${municipality}. Select the correct LGU.`,
      permit: { businessName: permit.businessName, municipality: permit.municipality }
    }
  }

  return {
    verified: true,
    code: 'VERIFIED',
    message: `Verified with ${permit.municipality} LGU. Registered business: ${permit.businessName}.`,
    permit: {
      permitNumber: permitNumber.trim().toUpperCase(),
      ownerName: permit.ownerName,
      businessName: permit.businessName,
      municipality: permit.municipality,
      status: permit.status,
      issued: permit.issued,
      expires: permit.expires
    }
  }
}
