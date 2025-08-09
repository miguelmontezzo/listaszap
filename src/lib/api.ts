
const BASE = import.meta.env.VITE_N8N_BASE
const HEADERS = { 'Content-Type': 'application/json' }

export async function post<T=any>(path: string, body: any) {
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return (await r.json()) as T
}

export const api = {
  // AUTH
  requestOtp: (phone: string) => post<{ requestId: string }>('/auth/request-otp', { phone }),
  verifyOtp: (requestId: string, code: string) =>
    post<{ token: string; user: { id: string; phone: string; name: string } }>('/auth/verify-otp', { requestId, code }),

  // LISTS
  createList: (payload: { name: string; type?: string; split?: boolean; members?: string[] }) =>
    post<{ id: string }>('/lists/create', payload),
  addItemToList: (listId: string, item: { itemId?: string; name?: string; qty?: number; price?: number; categoryId?: string }) =>
    post('/lists/add-item', { listId, ...item }),
  toggleItem: (listId: string, itemId: string, checked: boolean) =>
    post('/lists/toggle-item', { listId, itemId, checked }),
  updateListSettings: (listId: string, settings: { split?: boolean }) =>
    post('/lists/update-settings', { listId, settings }),
  addMember: (listId: string, phone: string) =>
    post('/lists/add-member', { listId, phone }),

  // ITENS
  createItem: (name: string, categoryId?: string) => post<{ id: string }>('/items/create', { name, categoryId }),
  updateItem: (id: string, patch: any) => post('/items/update', { id, patch }),
  autocompleteItems: (q: string) => post<{ id: string; name: string }[]>('/items/autocomplete', { q }),
}
