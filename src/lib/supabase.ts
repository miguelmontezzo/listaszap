
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info('[Supabase] URL:', url.startsWith('https://') ? url : '(invalid)', 'KEY set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
}
export const supabase = createClient(url, key, { auth: { persistSession: false } })

/**
 * Busca informações do usuário no Supabase pelo ID (número canônico do WhatsApp, ex: 55DDDNNNNNNNN)
 * Tabela padrão: "users". Pode ser customizada via VITE_SUPABASE_USERS_TABLE.
 */
export async function fetchUserInfoById(userId: string): Promise<{ data: any | null; error: any | null }>{
  const table = (import.meta.env.VITE_SUPABASE_USERS_TABLE as string) || 'users'
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return { data, error }
}
