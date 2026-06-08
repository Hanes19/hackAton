import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import shopsRouter from './routes/shops.js'

console.log('URL:', process.env.SUPABASE_URL)
console.log('KEY:', process.env.SUPABASE_ANON_KEY)

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/shops', shopsRouter)

app.listen(3001, () => console.log('API running on http://localhost:3001'))