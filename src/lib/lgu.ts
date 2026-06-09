export interface LguMunicipality {
  id: string
  name: string
  province: string
}

export interface PermitVerificationResult {
  verified: boolean
  code: string
  message: string
  permit?: {
    permitNumber: string
    ownerName: string
    businessName: string
    municipality: string
    status: string
    issued: string
    expires: string
  }
}

export const ID_TYPES = [
  'Philippine National ID (PhilID)',
  "Driver's License",
  'Passport',
  'UMID',
  'SSS ID',
  'Postal ID',
  'PRC ID',
  'Voter\'s ID'
] as const

export type IdType = (typeof ID_TYPES)[number]

export async function fetchLguMunicipalities(): Promise<LguMunicipality[]> {
  const res = await fetch('/api/lgu/municipalities')
  if (!res.ok) throw new Error('Could not load LGU list')
  return res.json()
}

export async function verifyPermitWithLgu(
  permitNumber: string,
  ownerName: string,
  municipality: string
): Promise<PermitVerificationResult> {
  const res = await fetch('/api/lgu/verify-permit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permitNumber, ownerName, municipality })
  })
  return res.json()
}
