// Armazenamento local (localStorage) para dados reais no navegador

export type Category = { id: string; name: string; color: string }
export type Item = {
  id: string
  name: string
  categoryId: string
  price?: number
  defaultUnit?: 'unidade' | 'peso'
  defaultQty?: number
}
export type ListItem = { id: string; itemId: string; quantity: number; checked: boolean; price: number; unit?: 'unidade' | 'peso' }
export type ShoppingList = {
  id: string
  name: string
  description?: string
  createdAt: string
  userId: string
  items: ListItem[]
  type?: 'personal' | 'shared'
  memberCount?: number
  memberNames?: string[]
  splitEnabled?: boolean
  includeOwnerInSplit?: boolean
  charges?: {
    // list of member names (or ids) and their payment status
    byMember: { name: string; status: 'pendente' | 'cobrado' | 'pago'; proofName?: string }[]
  }
}

const K = {
  categories: 'lz_categories',
  items: 'lz_items',
  lists: 'lz_lists',
  contacts: 'lz_contacts',
} as const

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) || typeof parsed === 'object' ? parsed as T : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function ensureInit(): void {
  if (!localStorage.getItem(K.categories)) writeJson<Category[]>(K.categories, [])
  if (!localStorage.getItem(K.items)) writeJson<Item[]>(K.items, [])
  if (!localStorage.getItem(K.lists)) writeJson<ShoppingList[]>(K.lists, [])
}

ensureInit()

export const storage = {
  // CONTACTS
  async getContacts(): Promise<{ id: string; name: string; phone: string }[]> {
    return readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
  },
  async createContact(data: { name: string; phone: string }): Promise<{ id: string; name: string; phone: string }> {
    const contacts = readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
    const c = { id: Date.now().toString(), ...data }
    contacts.push(c)
    writeJson(K.contacts, contacts)
    return c
  },
  async updateContact(id: string, patch: Partial<{ name: string; phone: string }>): Promise<{ id: string; name: string; phone: string }>{
    const contacts = readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
    const idx = contacts.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Contato não encontrado')
    contacts[idx] = { ...contacts[idx], ...patch }
    writeJson(K.contacts, contacts)
    return contacts[idx]
  },
  async deleteContact(id: string): Promise<void> {
    const contacts = readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
    writeJson(K.contacts, contacts.filter(c => c.id !== id))
  },
  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    return readJson<Category[]>(K.categories, [])
  },

  async createCategory(data: { name: string; color: string }): Promise<Category> {
    const categories = readJson<Category[]>(K.categories, [])
    const newCategory: Category = { id: Date.now().toString(), ...data }
    categories.push(newCategory)
    writeJson(K.categories, categories)
    return newCategory
  },

  async updateCategory(id: string, patch: Partial<Category>): Promise<Category> {
    const categories = readJson<Category[]>(K.categories, [])
    const idx = categories.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Categoria não encontrada')
    categories[idx] = { ...categories[idx], ...patch, id }
    writeJson(K.categories, categories)
    return categories[idx]
  },

  async deleteCategory(id: string): Promise<void> {
    const categories = readJson<Category[]>(K.categories, [])
    const next = categories.filter(c => c.id !== id)
    writeJson(K.categories, next)
  },

  // ITEMS
  async getItems(): Promise<Item[]> {
    return readJson<Item[]>(K.items, [])
  },

  async createItem(data: { name: string; categoryId: string; price?: number; defaultUnit?: 'unidade' | 'peso'; defaultQty?: number }): Promise<Item> {
    const items = readJson<Item[]>(K.items, [])
    const newItem: Item = { id: Date.now().toString(), ...data }
    items.push(newItem)
    writeJson(K.items, items)
    return newItem
  },

  async updateItem(id: string, patch: Partial<Item>): Promise<Item> {
    const items = readJson<Item[]>(K.items, [])
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) throw new Error('Item não encontrado')
    items[idx] = { ...items[idx], ...patch }
    writeJson(K.items, items)
    return items[idx]
  },

  async deleteItem(id: string): Promise<void> {
    const items = readJson<Item[]>(K.items, [])
    const next = items.filter(i => i.id !== id)
    writeJson(K.items, next)
  },

  // LISTS
  async getLists(): Promise<ShoppingList[]> {
    return readJson<ShoppingList[]>(K.lists, [])
  },

  async getList(id: string): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const list = lists.find(l => l.id === id)
    if (!list) throw new Error('Lista não encontrada')
    return list
  },

  async updateList(id: string, patch: Partial<ShoppingList>): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === id)
    if (idx === -1) throw new Error('Lista não encontrada')
    lists[idx] = { ...lists[idx], ...patch }
    writeJson(K.lists, lists)
    return lists[idx]
  },

  async createList(data: {
    name: string
    description?: string
    type?: 'personal' | 'shared'
    memberCount?: number
    memberNames?: string[]
    initialItems?: string[]
    userId: string
    splitEnabled?: boolean
    includeOwnerInSplit?: boolean
  }): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const initialListItems: ListItem[] = (data.initialItems || []).map((itemId, index) => ({
      id: `${Date.now()}-${index}`,
      itemId,
      quantity: 1,
      checked: false,
      price: 0,
    }))
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      type: data.type || 'personal',
      memberCount: data.memberCount || 1,
      memberNames: data.memberNames || [],
      createdAt: new Date().toISOString(),
      userId: data.userId,
      items: initialListItems,
      splitEnabled: data.splitEnabled || false,
      includeOwnerInSplit: data.includeOwnerInSplit || false,
    }
    lists.push(newList)
    writeJson(K.lists, lists)
    return newList
  },

  async addItemToList(listId: string, item: { itemId: string; quantity?: number; price?: number; checked?: boolean; unit?: 'unidade' | 'peso' }): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === listId)
    if (idx === -1) throw new Error('Lista não encontrada')
    const newListItem: ListItem = {
      id: `${Date.now()}`,
      itemId: item.itemId,
      quantity: item.quantity ?? 1,
      checked: item.checked ?? false,
      price: item.price ?? 0,
      unit: item.unit,
    }
    lists[idx] = { ...lists[idx], items: [...lists[idx].items, newListItem] }
    writeJson(K.lists, lists)
    return lists[idx]
  },

  async updateListItem(listId: string, listItemId: string, patch: Partial<ListItem>): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === listId)
    if (idx === -1) throw new Error('Lista não encontrada')
    const items = lists[idx].items.map(li => li.id === listItemId ? { ...li, ...patch } : li)
    lists[idx] = { ...lists[idx], items }
    writeJson(K.lists, lists)
    return lists[idx]
  },

  async toggleListItem(listId: string, listItemId: string, checked: boolean): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === listId)
    if (idx === -1) throw new Error('Lista não encontrada')
    const items = lists[idx].items.map(li => li.id === listItemId ? { ...li, checked } : li)
    lists[idx] = { ...lists[idx], items }
    writeJson(K.lists, lists)
    return lists[idx]
  },

  async deleteListItem(listId: string, listItemId: string): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === listId)
    if (idx === -1) throw new Error('Lista não encontrada')
    const items = lists[idx].items.filter(li => li.id !== listItemId)
    lists[idx] = { ...lists[idx], items }
    writeJson(K.lists, lists)
    return lists[idx]
  },

  async deleteList(listId: string): Promise<void> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const next = lists.filter(l => l.id !== listId)
    writeJson(K.lists, next)
  },

  async updateMemberChargeStatus(listId: string, memberName: string, status: 'pendente'|'cobrado'|'pago', proofName?: string): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === listId)
    if (idx === -1) throw new Error('Lista não encontrada')
    const list = lists[idx]
    // garantir estrutura charges
    const names = list.memberNames || []
    let byMember = list.charges?.byMember
    if (!byMember || byMember.length === 0) {
      byMember = names.map(n => ({ name: n, status: 'pendente' as const }))
    }
    const updatedByMember = byMember.map(m => m.name === memberName ? { ...m, status, proofName } : m)
    const updated = { ...list, charges: { byMember: updatedByMember } }
    lists[idx] = updated
    writeJson(K.lists, lists)
    return updated
  },

  // UTIL
  resetAll(): void {
    writeJson<Category[]>(K.categories, [])
    writeJson<Item[]>(K.items, [])
    writeJson<ShoppingList[]>(K.lists, [])
  },
}

