// Storage: usa Supabase quando configurado; caso contrário, fallback local para não quebrar em produção
export type { Category, Item, ShoppingList, ListItem } from './storage.types'

import { storage as storageSupabase } from './storage.supabase'
import { storageLocal } from './storage.local'

const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
export const storage = hasSupabase ? storageSupabase : storageLocal
export const isSupabaseStorage = hasSupabase

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info('[ListasZap] Storage driver:', hasSupabase ? 'supabase' : 'local')
}

