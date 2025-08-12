// Storage: uso obrigatório do Supabase; desabilita fallback local
export type { Category, Item, ShoppingList, ListItem } from './storage.types'

import { storage as storageSupabase } from './storage.supabase'
export const storage = storageSupabase
export const isSupabaseStorage = true

if (import.meta.env.DEV) {
  // Ajuda a identificar qual driver está ativo no console do navegador
  // eslint-disable-next-line no-console
  console.info('[ListasZap] Storage driver:', 'supabase')
}

