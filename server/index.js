import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import shopsRouter from './routes/shops.js'
import productsRouter from './routes/products.js'
import assistantRouter from './routes/assistant.js'
import lguRouter from './routes/lgu.js'
import ordersRouter from './routes/orders.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })
dotenv.config({ path: join(__dirname, '..', '.env') })

// FIXED: Look for the PUBLIC_ prefixed variables from your root .env file
console.log('URL:', process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
console.log('KEY:', process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/shops', shopsRouter)
app.use('/api/products', productsRouter)
app.use('/api/lgu', lguRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/assistant', assistantRouter)

app.listen(3001, () => console.log('API running on http://localhost:3001'))