
import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info('[Supabase] URL:', url.startsWith('https://') ? url : '(invalid)', 'KEY set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
}
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : ({} as any)

/**
 * Busca informações do usuário no Supabase pelo ID (número canônico do WhatsApp, ex: 55DDDNNNNNNNN)
 * Tabela padrão: "users". Pode ser customizada via VITE_SUPABASE_USERS_TABLE.
 */
export async function fetchUserInfoById(userId: string): Promise<{ data: any | null; error: any | null }>{
  if (!url || !key) return { data: null, error: null }
  const table = (import.meta.env.VITE_SUPABASE_USERS_TABLE as string) || 'users'
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return { data, error }
}
