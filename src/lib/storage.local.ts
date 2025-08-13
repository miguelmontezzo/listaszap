import type { Category, Item, ShoppingList, ListItem } from './storage.types'

// Armazenamento local (localStorage) para dados reais no navegador

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-carnes', name: 'Carnes', color: '#ef4444' },
  { id: 'default-bebidas', name: 'Bebidas', color: '#3b82f6' },
  { id: 'default-frutas', name: 'Frutas', color: '#22c55e' },
  { id: 'default-verduras', name: 'Verduras e Legumes', color: '#16a34a' },
  { id: 'default-padaria', name: 'Padaria', color: '#f59e0b' },
  { id: 'default-laticinios', name: 'Laticínios', color: '#60a5fa' },
  { id: 'default-mercearia', name: 'Mercearia', color: '#a78bfa' },
  { id: 'default-higiene', name: 'Higiene Pessoal', color: '#06b6d4' },
  { id: 'default-limpeza', name: 'Produtos de Limpeza', color: '#10b981' },
  { id: 'default-pet', name: 'Pet', color: '#f472b6' },
  { id: 'default-bebes', name: 'Bebês', color: '#fb923c' },
]

const DEFAULT_ITEMS: Item[] = [
  { id: 'seed-picanha', name: 'Picanha', categoryId: 'default-carnes', price: 70, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-frango', name: 'Frango (kg)', categoryId: 'default-carnes', price: 14.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-acem', name: 'Acém (kg)', categoryId: 'default-carnes', price: 32.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-agua-1l', name: 'Água 1,5L', categoryId: 'default-bebidas', price: 3.5, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-refrigerante-2l', name: 'Refrigerante 2L', categoryId: 'default-bebidas', price: 9.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-suco-caixa', name: 'Suco de Caixinha', categoryId: 'default-bebidas', price: 4.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-banana', name: 'Banana (kg)', categoryId: 'default-frutas', price: 7.5, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-maca', name: 'Maçã (kg)', categoryId: 'default-frutas', price: 9.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-laranja', name: 'Laranja (kg)', categoryId: 'default-frutas', price: 6.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-tomate', name: 'Tomate (kg)', categoryId: 'default-verduras', price: 8.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-alface', name: 'Alface', categoryId: 'default-verduras', price: 3.5, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-cebola', name: 'Cebola (kg)', categoryId: 'default-verduras', price: 6.5, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-pao-frances', name: 'Pão Francês (kg)', categoryId: 'default-padaria', price: 17.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-pao-de-forma', name: 'Pão de Forma', categoryId: 'default-padaria', price: 8.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-leite', name: 'Leite 1L', categoryId: 'default-laticinios', price: 4.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-queijo', name: 'Queijo Mussarela (kg)', categoryId: 'default-laticinios', price: 39.9, defaultUnit: 'peso', defaultQty: 1 },
  { id: 'seed-arroz', name: 'Arroz 5kg', categoryId: 'default-mercearia', price: 24.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-feijao', name: 'Feijão 1kg', categoryId: 'default-mercearia', price: 9.5, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-acucar', name: 'Açúcar 1kg', categoryId: 'default-mercearia', price: 4.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-oleo', name: 'Óleo 900ml', categoryId: 'default-mercearia', price: 7.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-sal', name: 'Sal 1kg', categoryId: 'default-mercearia', price: 3.2, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-sabonete', name: 'Sabonete', categoryId: 'default-higiene', price: 2.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-pasta-dente', name: 'Pasta de Dente', categoryId: 'default-higiene', price: 5.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-detergente', name: 'Detergente', categoryId: 'default-limpeza', price: 2.99, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-desinfetante', name: 'Desinfetante', categoryId: 'default-limpeza', price: 7.5, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-racao', name: 'Ração 1kg', categoryId: 'default-pet', price: 15.9, defaultUnit: 'unidade', defaultQty: 1 },
  { id: 'seed-fralda', name: 'Fralda', categoryId: 'default-bebes', price: 49.9, defaultUnit: 'unidade', defaultQty: 1 },
]

const K = {
  categories: 'lz_categories',
  items: 'lz_items',
  lists: 'lz_lists',
  sharedLists: 'lz_lists_shared',
  contacts: 'lz_contacts',
} as const

function currentUserId(): string {
  try {
    const raw = localStorage.getItem('lz_session')
    if (!raw) return 'guest'
    const s = JSON.parse(raw)
    return s?.user?.id || 'guest'
  } catch {
    return 'guest'
  }
}

function userKey(base: string): string {
  const uid = currentUserId()
  return `${base}:${uid}`
}

function readGlobalJson<T>(baseKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(baseKey)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) || typeof parsed === 'object' ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function writeGlobalJson<T>(baseKey: string, value: T): void {
  localStorage.setItem(baseKey, JSON.stringify(value))
}

function readJson<T>(baseKey: string, fallback: T): T {
  try {
    const key = userKey(baseKey)
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) || typeof parsed === 'object' ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(baseKey: string, value: T): void {
  localStorage.setItem(userKey(baseKey), JSON.stringify(value))
}

function ensureInit(): void {
  const migrateIfNeeded = <T,>(baseKey: string, fallback: T): void => {
    const scoped = localStorage.getItem(userKey(baseKey))
    if (scoped !== null) return
    const legacy = localStorage.getItem(baseKey)
    if (legacy !== null) {
      localStorage.setItem(userKey(baseKey), legacy)
      return
    }
    localStorage.setItem(userKey(baseKey), JSON.stringify(fallback))
  }

  migrateIfNeeded<Category[]>(K.categories, [])
  migrateIfNeeded<Item[]>(K.items, [])
  migrateIfNeeded<ShoppingList[]>(K.lists, [])
  migrateIfNeeded<{ id: string; name: string; phone: string }[]>(K.contacts, [])
  if (localStorage.getItem(K.sharedLists) === null) {
    writeGlobalJson<ShoppingList[]>(K.sharedLists, [])
  }

  try {
    const cats = readJson<Category[]>(K.categories, [])
    if (Array.isArray(cats) && cats.length === 0) {
      writeJson(K.categories, DEFAULT_CATEGORIES)
    }
  } catch {}
  try {
    const items = readJson<Item[]>(K.items, [])
    if (Array.isArray(items) && items.length === 0) {
      writeJson(K.items, DEFAULT_ITEMS)
    } else if (Array.isArray(items)) {
      const nameSet = new Set(items.map(i => i.name.trim().toLowerCase()))
      const missing = DEFAULT_ITEMS.filter(d => !nameSet.has(d.name.trim().toLowerCase()))
      if (items.length < 5 && missing.length > 0) {
        writeJson(K.items, [...items, ...missing])
      }
    }
  } catch {}
}

export const storageLocal = {
  initForCurrentUser(): void {
    ensureInit()
  },
  async getContacts(): Promise<{ id: string; name: string; phone: string }[]> {
    return readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
  },
  async createContact(data: { name: string; phone: string }) {
    const contacts = readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
    const c = { id: Date.now().toString(), ...data }
    contacts.push(c)
    writeJson(K.contacts, contacts)
    return c
  },
  async updateContact(id: string, patch: Partial<{ name: string; phone: string }>) {
    const contacts = readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
    const idx = contacts.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Contato não encontrado')
    contacts[idx] = { ...contacts[idx], ...patch }
    writeJson(K.contacts, contacts)
    return contacts[idx]
  },
  async deleteContact(id: string) {
    const contacts = readJson<{ id: string; name: string; phone: string }[]>(K.contacts, [])
    writeJson(K.contacts, contacts.filter(c => c.id !== id))
  },
  async getCategories(): Promise<Category[]> {
    return readJson<Category[]>(K.categories, [])
  },
  async getCategoriesByIds(ids: string[]): Promise<Category[]> {
    if (!Array.isArray(ids) || ids.length === 0) return []
    const categories = readJson<Category[]>(K.categories, [])
    const set = new Set(ids)
    return categories.filter(c => set.has(c.id))
  },
  async createCategory(data: { name: string; color: string }) {
    const categories = readJson<Category[]>(K.categories, [])
    const newCategory: Category = { id: Date.now().toString(), ...data }
    categories.push(newCategory)
    writeJson(K.categories, categories)
    return newCategory
  },
  async updateCategory(id: string, patch: Partial<Category>) {
    const categories = readJson<Category[]>(K.categories, [])
    const idx = categories.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Categoria não encontrado')
    categories[idx] = { ...categories[idx], ...patch, id }
    writeJson(K.categories, categories)
    return categories[idx]
  },
  async deleteCategory(id: string) {
    const categories = readJson<Category[]>(K.categories, [])
    const next = categories.filter(c => c.id !== id)
    writeJson(K.categories, next)
  },
  async getItems(): Promise<Item[]> {
    return readJson<Item[]>(K.items, [])
  },
  async getItemsByIds(ids: string[]): Promise<Item[]> {
    if (!Array.isArray(ids) || ids.length === 0) return []
    const items = readJson<Item[]>(K.items, [])
    const set = new Set(ids)
    return items.filter(i => set.has(i.id))
  },
  async createItem(data: { name: string; categoryId: string; price?: number; defaultUnit?: 'unidade' | 'peso'; defaultQty?: number }) {
    const items = readJson<Item[]>(K.items, [])
    const newItem: Item = { id: Date.now().toString(), ...data }
    items.push(newItem)
    writeJson(K.items, items)
    return newItem
  },
  async updateItem(id: string, patch: Partial<Item>) {
    const items = readJson<Item[]>(K.items, [])
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) throw new Error('Item não encontrado')
    items[idx] = { ...items[idx], ...patch }
    writeJson(K.items, items)
    return items[idx]
  },
  async deleteItem(id: string) {
    const items = readJson<Item[]>(K.items, [])
    const next = items.filter(i => i.id !== id)
    writeJson(K.items, next)
  },
  async getLists(): Promise<ShoppingList[]> {
    const mine = readJson<ShoppingList[]>(K.lists, [])
    const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
    return [...shared, ...mine]
  },
  async getList(id: string): Promise<ShoppingList> {
    const mine = readJson<ShoppingList[]>(K.lists, [])
    let list = mine.find(l => l.id === id)
    if (list) return list
    const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
    list = shared.find(l => l.id === id)
    if (!list) throw new Error('Lista não encontrada')
    return list
  },
  async updateList(id: string, patch: Partial<ShoppingList>): Promise<ShoppingList> {
    let lists = readJson<ShoppingList[]>(K.lists, [])
    let idx = lists.findIndex(l => l.id === id)
    if (idx !== -1) {
      const updated = { ...lists[idx], ...patch }
      if ((updated.type || 'personal') === 'shared') {
        const remaining = lists.filter(l => l.id !== id)
        writeJson(K.lists, remaining)
        const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
        const sidx = shared.findIndex(l => l.id === id)
        if (sidx !== -1) shared[sidx] = updated
        else shared.push(updated)
        writeGlobalJson(K.sharedLists, shared)
        return updated
      }
      lists[idx] = updated
      writeJson(K.lists, lists)
      return updated
    }
    const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
    const sidx = shared.findIndex(l => l.id === id)
    if (sidx === -1) throw new Error('Lista não encontrada')
    shared[sidx] = { ...shared[sidx], ...patch }
    writeGlobalJson(K.sharedLists, shared)
    return shared[sidx]
  },
  async promoteListToShared(id: string): Promise<ShoppingList> {
    const mine = readJson<ShoppingList[]>(K.lists, [])
    const idx = mine.findIndex(l => l.id === id)
    if (idx !== -1) {
      const [list] = mine.splice(idx, 1)
      const promoted: ShoppingList = { ...list, type: 'shared' }
      writeJson(K.lists, mine)
      const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
      const exists = shared.find(s => s.id === promoted.id)
      if (!exists) {
        shared.push(promoted)
      }
      writeGlobalJson(K.sharedLists, shared)
      return promoted
    }
    const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
    const found = shared.find(s => s.id === id)
    if (!found) throw new Error('Lista não encontrada')
    if (found.type !== 'shared') {
      const next = shared.map(s => (s.id === id ? { ...s, type: 'shared' as const } : s))
      writeGlobalJson(K.sharedLists, next)
      return next.find(s => s.id === id)!
    }
    return found
  },
  async createList(data: {
    name: string
    description?: string
    type?: 'personal' | 'shared'
    memberCount?: number
    memberNames?: string[]
    memberPhones?: string[]
    initialItems?: string[]
    userId: string
    splitEnabled?: boolean
    includeOwnerInSplit?: boolean
  }): Promise<ShoppingList> {
    const isShared = (data.type || 'personal') === 'shared'
    const lists = isShared ? readGlobalJson<ShoppingList[]>(K.sharedLists, []) : readJson<ShoppingList[]>(K.lists, [])
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
      memberPhones: data.memberPhones || [],
      createdAt: new Date().toISOString(),
      userId: data.userId,
      items: initialListItems,
      splitEnabled: data.splitEnabled || false,
      includeOwnerInSplit: data.includeOwnerInSplit || false,
      allowMembersToInvite: false,
    }
    lists.push(newList)
    if (isShared) writeGlobalJson(K.sharedLists, lists)
    else writeJson(K.lists, lists)
    return newList
  },
  async addItemToList(listId: string, item: { itemId: string; quantity?: number; price?: number; checked?: boolean; unit?: 'unidade' | 'peso'; createdBy?: string }): Promise<ShoppingList> {
    let lists = readJson<ShoppingList[]>(K.lists, [])
    let idx = lists.findIndex(l => l.id === listId)
    let sharedStore = false
    if (idx === -1) {
      lists = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
      idx = lists.findIndex(l => l.id === listId)
      sharedStore = true
      if (idx === -1) throw new Error('Lista não encontrada')
    }
    const newListItem: ListItem = {
      id: `${Date.now()}`,
      itemId: item.itemId,
      quantity: item.quantity ?? 1,
      checked: item.checked ?? false,
      price: item.price ?? 0,
      unit: item.unit,
      createdBy: item.createdBy,
    }
    lists[idx] = { ...lists[idx], items: [...lists[idx].items, newListItem] }
    if (sharedStore) writeGlobalJson(K.sharedLists, lists)
    else writeJson(K.lists, lists)
    return lists[idx]
  },
  async updateListItem(listId: string, listItemId: string, patch: Partial<ListItem>): Promise<ShoppingList> {
    let lists = readJson<ShoppingList[]>(K.lists, [])
    let idx = lists.findIndex(l => l.id === listId)
    let sharedStore = false
    if (idx === -1) {
      lists = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
      idx = lists.findIndex(l => l.id === listId)
      sharedStore = true
      if (idx === -1) throw new Error('Lista não encontrada')
    }
    const items = lists[idx].items.map(li => (li.id === listItemId ? { ...li, ...patch } : li))
    lists[idx] = { ...lists[idx], items }
    if (sharedStore) writeGlobalJson(K.sharedLists, lists)
    else writeJson(K.lists, lists)
    return lists[idx]
  },
  async toggleListItem(listId: string, listItemId: string, checked: boolean): Promise<ShoppingList> {
    let lists = readJson<ShoppingList[]>(K.lists, [])
    let idx = lists.findIndex(l => l.id === listId)
    let sharedStore = false
    if (idx === -1) {
      lists = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
      idx = lists.findIndex(l => l.id === listId)
      sharedStore = true
      if (idx === -1) throw new Error('Lista não encontrada')
    }
    const items = lists[idx].items.map(li => (li.id === listItemId ? { ...li, checked } : li))
    lists[idx] = { ...lists[idx], items }
    if (sharedStore) writeGlobalJson(K.sharedLists, lists)
    else writeJson(K.lists, lists)
    return lists[idx]
  },
  async deleteListItem(listId: string, listItemId: string): Promise<ShoppingList> {
    let lists = readJson<ShoppingList[]>(K.lists, [])
    let idx = lists.findIndex(l => l.id === listId)
    let sharedStore = false
    if (idx === -1) {
      lists = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
      idx = lists.findIndex(l => l.id === listId)
      sharedStore = true
      if (idx === -1) throw new Error('Lista não encontrada')
    }
    const items = lists[idx].items.filter(li => li.id !== listItemId)
    lists[idx] = { ...lists[idx], items }
    if (sharedStore) writeGlobalJson(K.sharedLists, lists)
    else writeJson(K.lists, lists)
    return lists[idx]
  },
  async deleteList(listId: string): Promise<void> {
    const mine = readJson<ShoppingList[]>(K.lists, [])
    const nextMine = mine.filter(l => l.id !== listId)
    if (nextMine.length !== mine.length) {
      writeJson(K.lists, nextMine)
      return
    }
    const shared = readGlobalJson<ShoppingList[]>(K.sharedLists, [])
    const nextShared = shared.filter(l => l.id !== listId)
    if (nextShared.length !== shared.length) {
      writeGlobalJson(K.sharedLists, nextShared)
      return
    }
  },
  async updateMemberChargeStatus(listId: string, memberName: string, status: 'pendente'|'cobrado'|'pago', proofName?: string): Promise<ShoppingList> {
    const lists = readJson<ShoppingList[]>(K.lists, [])
    const idx = lists.findIndex(l => l.id === listId)
    if (idx === -1) throw new Error('Lista não encontrada')
    const list = lists[idx]
    const names = list.memberNames || []
    let byMember = list.charges?.byMember
    if (!byMember || byMember.length === 0) {
      byMember = names.map(n => ({ name: n, status: 'pendente' as const }))
    }
    const updatedByMember = byMember.map(m => (m.name === memberName ? { ...m, status, proofName } : m))
    const updated = { ...list, charges: { byMember: updatedByMember } }
    lists[idx] = updated
    writeJson(K.lists, lists)
    return updated
  },
  resetAll(): void {
    writeJson<Category[]>(K.categories, [])
    writeJson<Item[]>(K.items, [])
    writeJson<ShoppingList[]>(K.lists, [])
  },
}

