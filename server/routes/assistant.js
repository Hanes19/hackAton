import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

const SYSTEM_PROMPT = `You are Budol Assistant, the AI helper for Budol Map — a local marketplace in Bukidnon, Philippines.

You help users with:
1. **Navigation** — guide them to the right page in the app
2. **Seller onboarding** — explain how to register and set up a shop
3. **Product discovery** — when search results are provided, recommend matching shops/products
4. **General chat** — answer questions warmly and concisely

App pages:
- / — Home landing page
- /map — Interactive map to browse local shops
- /shops/{id} — View a specific shop and its products
- /login — Sign in
- /register-user — Create a buyer account
- /register — Seller registration with LGU business permit verification and valid ID
- /dashboard — Seller dashboard (manage products) — requires login
- /admin — Admin panel — admins only

How to become a seller:
1. (Optional) Create an account at /register-user and sign in at /login
2. Go to /register for seller registration
3. Enter business info, owner name, and LGU municipality
4. Verify your Mayor's/Business Permit number with integrated LGU verification
5. Upload a valid government ID (PhilID, driver's license, passport, UMID, etc.)
6. Submit for admin review — shop appears on the map once approved
7. Add products from /dashboard

When product/shop matches appear in the context, mention them by name and price if available. Tell the user they can tap the button below to visit the shop.

Keep replies under 150 words unless explaining seller setup. Match the user's language (English, Tagalog, or Bisaya).

End every reply with a single line (no markdown fences):
ACTIONS: {"actions":[{"type":"navigate","url":"/map","label":"Open Map"}]}

Use navigate actions only when helpful. For a specific shop use /shops/{shop_id}. Omit actions with an empty array if none are needed.`

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function searchCatalog(query, shops) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const stopWords = new Set([
    'the', 'and', 'for', 'you', 'can', 'how', 'where', 'find', 'search',
    'looking', 'want', 'need', 'buy', 'get', 'shop', 'store', 'item', 'product',
    'please', 'help', 'show', 'any', 'are', 'there', 'what', 'which', 'that',
    'this', 'with', 'from', 'have', 'has', 'sell', 'selling', 'near', 'me'
  ])
  const keywords = tokens.filter((t) => !stopWords.has(t))
  const terms = keywords.length > 0 ? keywords : tokens

  const results = []
  const seen = new Set()

  for (const shop of shops) {
    const shopText = `${shop.name} ${shop.category} ${shop.description || ''} ${shop.address || ''}`.toLowerCase()

    for (const product of shop.products || []) {
      const productText = `${product.name} ${product.description || ''}`.toLowerCase()
      const haystack = `${shopText} ${productText}`
      const score = terms.filter((t) => haystack.includes(t)).length
      if (score > 0) {
        const key = `${shop.id}:${product.id}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({ shop, product, score })
        }
      }
    }

    const shopScore = terms.filter((t) => shopText.includes(t)).length
    if (shopScore > 0 && !seen.has(`${shop.id}:shop`)) {
      seen.add(`${shop.id}:shop`)
      results.push({ shop, product: null, score: shopScore })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5)
}

function buildCatalogSummary(shops) {
  return shops
    .slice(0, 30)
    .map((s) => {
      const products = (s.products || [])
        .slice(0, 8)
        .map((p) => `  - ${p.name} (₱${p.price})`)
        .join('\n')
      return `Shop: ${s.name} [id:${s.id}] (${s.category}) — ${s.address || 'Bukidnon'}\n${products || '  (no products listed)'}`
    })
    .join('\n\n')
}

function parseActions(text) {
  const match = text.match(/ACTIONS:\s*(\{[\s\S]*\})\s*$/)
  if (!match) return { message: text.trim(), actions: [] }

  try {
    const parsed = JSON.parse(match[1])
    const message = text.replace(/\nACTIONS:\s*\{[\s\S]*\}\s*$/, '').trim()
    return { message, actions: Array.isArray(parsed.actions) ? parsed.actions : [] }
  } catch {
    return { message: text.trim(), actions: [] }
  }
}

function actionsFromMatches(matches) {
  return matches.slice(0, 3).map(({ shop, product }) => ({
    type: 'navigate',
    url: `/shops/${shop.id}`,
    label: product ? `View ${product.name} at ${shop.name}` : `Visit ${shop.name}`
  }))
}

function fallbackReply(message, matches, page) {
  const lower = message.toLowerCase()

  if (/dashboard|seller|sell|business|shop setup|register.*shop|become.*seller/.test(lower)) {
    return {
      message:
        'To set up your business:\n\n1. Create an account at Register\n2. Log in\n3. Go to your Seller Dashboard\n4. Fill in shop details and pin your location on the map\n5. Add your products\n\nNeed help with a specific step? Just ask!',
      actions: [
        { type: 'navigate', url: '/register-user', label: 'Create Account' },
        { type: 'navigate', url: '/dashboard', label: 'Seller Dashboard' }
      ]
    }
  }

  if (/map|browse|discover|near me|local shop/.test(lower)) {
    return {
      message: 'The map page lets you browse local shops in Bukidnon, filter by category, and get directions. Want me to take you there?',
      actions: [{ type: 'navigate', url: '/map', label: 'Open Map' }]
    }
  }

  if (/login|sign in/.test(lower)) {
    return {
      message: 'You can sign in with your email and password on the login page.',
      actions: [{ type: 'navigate', url: '/login', label: 'Go to Login' }]
    }
  }

  if (/register|sign up|create account/.test(lower)) {
    return {
      message: 'Create a free account to save your preferences. Sellers can then set up their shop from the dashboard.',
      actions: [{ type: 'navigate', url: '/register-user', label: 'Register' }]
    }
  }

  if (matches.length > 0) {
    const top = matches[0]
    const productLine = top.product
      ? `"${top.product.name}" (₱${top.product.price}) at ${top.shop.name}`
      : top.shop.name
    return {
      message: `I found ${matches.length} match${matches.length > 1 ? 'es' : ''} for your search. Top result: ${productLine}. Tap below to view the shop!`,
      actions: actionsFromMatches(matches)
    }
  }

  return {
    message: `Hi! I'm Budol Assistant. I can help you find local products, navigate the app, or guide you through setting up a shop. You're currently on ${page || 'the app'}. Try asking "find coffee" or "how do I become a seller?"`,
    actions: [
      { type: 'navigate', url: '/map', label: 'Browse Shops' },
      { type: 'navigate', url: '/dashboard', label: 'Seller Dashboard' }
    ]
  }
}

async function callGemini(userMessage, history, catalogSummary, matches, page) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const matchContext =
    matches.length > 0
      ? `\n\nSearch matches for the user's query:\n${matches
          .map(({ shop, product }) =>
            product
              ? `- "${product.name}" ₱${product.price} at ${shop.name} (shop id: ${shop.id})`
              : `- Shop "${shop.name}" (${shop.category}) id: ${shop.id}`
          )
          .join('\n')}`
      : '\n\nNo direct product/shop matches found for this query.'

  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    {
      role: 'user',
      parts: [
        {
          text: `Current page: ${page || '/'}\n\nCatalog snapshot:\n${catalogSummary}${matchContext}\n\nUser message: ${userMessage}`
        }
      ]
    }
  ]

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash']
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
          })
        }
      )

      if (!res.ok) continue

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch {
      continue
    }
  }

  return null
}

router.post('/', async (req, res) => {
  try {
    const { message, history = [], page = '/' } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const { data: shops, error } = await getSupabase()
      .from('shops')
      .select('*, products(*)')

    if (error) return res.status(500).json({ error: error.message })

    const catalog = shops || []
    const matches = searchCatalog(message.trim(), catalog)
    const catalogSummary = buildCatalogSummary(catalog)

    const aiText = await callGemini(message.trim(), history, catalogSummary, matches, page)

    if (aiText) {
      const { message: reply, actions } = parseActions(aiText)
      const mergedActions =
        actions.length > 0 ? actions : matches.length > 0 ? actionsFromMatches(matches) : []

      return res.json({ message: reply, actions: mergedActions, matches: matches.length })
    }

    const fallback = fallbackReply(message.trim(), matches, page)
    return res.json({ ...fallback, matches: matches.length })
  } catch (err) {
    console.error('Assistant error:', err)
    res.status(500).json({ error: 'Assistant unavailable. Please try again.' })
  }
})

export default router
