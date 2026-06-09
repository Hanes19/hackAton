import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface SessionInfo {
  user: User | null
  isAdmin: boolean
  hasShop: boolean
  displayName: string | null
}

export async function register(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })
  return { data, error }
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getSessionInfo(): Promise<SessionInfo> {
  const user = await getUser()
  if (!user) {
    return { user: null, isAdmin: false, hasShop: false, displayName: null }
  }

  const [profileRes, shopRes] = await Promise.all([
    supabase.from('profiles').select('is_admin, name').eq('id', user.id).maybeSingle(),
    fetch(`/api/shops/user/${user.id}`)
  ])

  const isAdmin = profileRes.data?.is_admin === true
  const hasShop = shopRes.ok
  const displayName =
    profileRes.data?.name ??
    (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null) ??
    user.email?.split('@')[0] ??
    null

  return { user, isAdmin, hasShop, displayName }
}