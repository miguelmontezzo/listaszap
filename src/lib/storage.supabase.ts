import { supabase } from './supabase'
import type { Category, Item, ShoppingList, ListItem } from './storage.types'

const T = {
  categories: (import.meta.env.VITE_SUPABASE_TBL_CATEGORIES as string) || 'categorias',
  items: (import.meta.env.VITE_SUPABASE_TBL_ITEMS as string) || 'itens',
  lists: (import.meta.env.VITE_SUPABASE_TBL_LISTS as string) || 'listas',
  listItems: (import.meta.env.VITE_SUPABASE_TBL_LIST_ITEMS as string) || 'item_listas',
  contacts: (import.meta.env.VITE_SUPABASE_TBL_CONTACTS as string) || 'contatos',
  listMembers: (import.meta.env.VITE_SUPABASE_TBL_LIST_MEMBERS as string) || 'membros_lista',
}

function ensureOk<T>(data: T | null, error: any): T {
  if (error) throw error
  return (data as T) ?? (null as any)
}

export const storage = {
  initForCurrentUser(): void {},

  // Contacts
  async getContacts(): Promise<{ id: string; name: string; phone: string }[]> {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    const q = supabase.from(T.contacts).select('id, nome, numero_whatsapp, id_usuario')
    const { data, error } = uid ? await q.eq('id_usuario', uid) : await q
    const rows = ensureOk(data, error) as any[]
    return rows.map(r => ({ id: r.id, name: r.nome, phone: r.numero_whatsapp }))
  },
  async createContact(payload: { name: string; phone: string }) {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    const { data, error } = await supabase.from(T.contacts).insert({
      id_usuario: uid,
      nome: payload.name,
      numero_whatsapp: payload.phone,
    }).select().single()
    const r = ensureOk(data, error) as any
    return { id: r.id, name: r.nome, phone: r.numero_whatsapp }
  },
  async updateContact(id: string, patch: Partial<{ name: string; phone: string }>) {
    const { data, error } = await supabase.from(T.contacts).update({
      nome: patch.name,
      numero_whatsapp: patch.phone,
    }).eq('id', id).select().single()
    const r = ensureOk(data, error) as any
    return { id: r.id, name: r.nome, phone: r.numero_whatsapp }
  },
  async deleteContact(id: string) {
    const { error } = await supabase.from(T.contacts).delete().eq('id', id)
    if (error) throw error
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    let q = supabase.from(T.categories).select('id_categoria, nome_categoria, cor_categoria, id_usuario')
    if (uid) q = q.eq('id_usuario', uid)
    const { data, error } = await q.order('nome_categoria', { ascending: true })
    const rows = ensureOk(data, error) as any[]
    return rows.map(r => ({ id: r.id_categoria, name: r.nome_categoria, color: r.cor_categoria }))
  },
  async getCategoriesByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return []
    const { data, error } = await supabase
      .from(T.categories)
      .select('id_categoria, nome_categoria, cor_categoria')
      .in('id_categoria', ids)
    const rows = ensureOk(data, error) as any[]
    return rows.map(r => ({ id: r.id_categoria, name: r.nome_categoria, color: r.cor_categoria }))
  },
  async createCategory(payload: { name: string; color: string }) {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    const { data, error } = await supabase.from(T.categories).insert({
      nome_categoria: payload.name,
      cor_categoria: payload.color,
      id_usuario: uid,
    }).select().single()
    const r = ensureOk(data, error) as any
    return { id: r.id_categoria, name: r.nome_categoria, color: r.cor_categoria } as Category
  },
  async updateCategory(id: string, patch: Partial<Category>) {
    const { data, error } = await supabase.from(T.categories).update({
      nome_categoria: patch.name,
      cor_categoria: patch.color,
    }).eq('id_categoria', id).select().single()
    const r = ensureOk(data, error) as any
    return { id: r.id_categoria, name: r.nome_categoria, color: r.cor_categoria } as Category
  },
  async deleteCategory(id: string) {
    const { error } = await supabase.from(T.categories).delete().eq('id_categoria', id)
    if (error) throw error
  },

  // Items
  async getItems(): Promise<Item[]> {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    let q = supabase.from(T.items).select('id_item, nome_do_item, valor_do_item, valor_por_unidade_ou_peso, id_categoria, id_usuario, unidade_padrao, quantidade_padrao')
    if (uid) q = q.eq('id_usuario', uid)
    const { data, error } = await q
    const rows = ensureOk(data, error) as any[]
    return rows.map(r => ({
      id: r.id_item,
      name: r.nome_do_item,
      categoryId: r.id_categoria,
      price: r.valor_do_item ?? r.valor_por_unidade_ou_peso ?? undefined,
      defaultUnit: r.unidade_padrao ?? undefined,
      defaultQty: r.quantidade_padrao ?? undefined,
    }))
  },
  async getItemsByIds(ids: string[]): Promise<Item[]> {
    if (ids.length === 0) return []
    const { data, error } = await supabase
      .from(T.items)
      .select('id_item, nome_do_item, valor_do_item, valor_por_unidade_ou_peso, id_categoria, unidade_padrao, quantidade_padrao')
      .in('id_item', ids)
    const rows = ensureOk(data, error) as any[]
    return rows.map(r => ({
      id: r.id_item,
      name: r.nome_do_item,
      categoryId: r.id_categoria,
      price: r.valor_do_item ?? r.valor_por_unidade_ou_peso ?? undefined,
      defaultUnit: r.unidade_padrao ?? undefined,
      defaultQty: r.quantidade_padrao ?? undefined,
    }))
  },
  async createItem(payload: { name: string; categoryId: string; price?: number; defaultUnit?: 'unidade' | 'peso'; defaultQty?: number }) {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    const { data, error } = await supabase.from(T.items).insert({
      nome_do_item: payload.name,
      id_categoria: payload.categoryId || null,
      valor_do_item: payload.price ?? null,
      unidade_padrao: payload.defaultUnit ?? 'unidade',
      quantidade_padrao: payload.defaultQty ?? 1,
      id_usuario: uid,
    }).select().single()
    const r = ensureOk(data, error) as any
    return {
      id: r.id_item,
      name: r.nome_do_item,
      categoryId: r.id_categoria,
      price: r.valor_do_item ?? undefined,
      defaultUnit: r.unidade_padrao ?? undefined,
      defaultQty: r.quantidade_padrao ?? undefined,
    }
  },
  async updateItem(id: string, patch: Partial<Item>) {
    const { data, error } = await supabase.from(T.items).update({
      nome_do_item: patch.name,
      id_categoria: patch.categoryId,
      valor_do_item: patch.price,
      unidade_padrao: patch.defaultUnit,
      quantidade_padrao: patch.defaultQty,
    }).eq('id_item', id).select().single()
    const r = ensureOk(data, error) as any
    return {
      id: r.id_item,
      name: r.nome_do_item,
      categoryId: r.id_categoria,
      price: r.valor_do_item ?? undefined,
      defaultUnit: r.unidade_padrao ?? undefined,
      defaultQty: r.quantidade_padrao ?? undefined,
    }
  },
  async deleteItem(id: string) {
    const { error } = await supabase.from(T.items).delete().eq('id_item', id)
    if (error) throw error
  },

  // Lists
  async getLists(): Promise<ShoppingList[]> {
    // Carregar listas: as criadas por mim + as que eu participo via membros_lista
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined

    // 1) Listas criadas pelo usuário
    const createdResp = await supabase
      .from(T.lists)
      .select('*, item_listas(*)')
      .eq('id_criador', uid || null)
    const createdRows = ensureOk(createdResp.data, createdResp.error) as any[]

    // 2) Listas onde o usuário é membro (id_membro = uid)
    let memberListIds: string[] = []
    if (uid) {
      let mIds: any = null
      let mErr: any = null
      {
        const resp = await supabase
          .from(T.listMembers)
          .select('id_lista')
          .eq('id_membro', uid)
        mIds = resp.data; mErr = resp.error
      }
      if (mErr && mErr.code === 'PGRST205') {
        const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
        const resp2 = await supabase
          .from(ALT)
          .select('id_lista')
          .eq('id_membro', uid)
        mIds = resp2.data; mErr = resp2.error
        if (!mErr) { (T as any).listMembers = ALT }
      }
      // Se sem permissão/401, ignora e segue só com criadas
      if (mErr && (mErr.code === '42501' || mErr.code === '401' || String(mErr.message||'').toLowerCase().includes('permission denied') || String(mErr.message||'').toLowerCase().includes('unauthorized'))) {
        mIds = []
        mErr = null
      }
      const rowsIds = ensureOk(mIds, mErr) as any[]
      memberListIds = rowsIds.map(r => r.id_lista).filter(Boolean)
    }

    // 3) Buscar listas pelas quais sou membro (excluindo as já criadas por mim para evitar duplicidade)
    let memberRows: any[] = []
    if (memberListIds.length > 0) {
      const already = new Set(createdRows.map(r => r.id ?? r.id_lista))
      const onlyNew = memberListIds.filter(id => !already.has(id))
      if (onlyNew.length > 0) {
        const byMemberResp = await supabase
          .from(T.lists)
          .select('*, item_listas(*)')
          .in('id_lista', onlyNew)
        memberRows = ensureOk(byMemberResp.data, byMemberResp.error) as any[]
      }
    }

    const rows = [...createdRows, ...memberRows]

    // Buscar membros de todas as listas em um único roundtrip
    const listIds = rows.map((r: any) => r.id ?? r.id_lista).filter(Boolean)
    let membersByListId = new Map<string, { names: string[]; phones: string[] }>()
    if (listIds.length > 0) {
      // Tentativa primária
      let mData: any = null
      let mErr: any = null
      {
        const resp = await supabase
          .from(T.listMembers)
          .select('*')
          .in('id_lista', listIds)
        mData = resp.data; mErr = resp.error
      }
      // Fallback para nome alternativo de tabela
      if (mErr && mErr.code === 'PGRST205') {
        const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
        const resp2 = await supabase
          .from(ALT)
          .select('*')
          .in('id_lista', listIds)
        mData = resp2.data; mErr = resp2.error
        if (!mErr) {
          ;(T as any).listMembers = ALT
        }
      }
      // Se não houver permissão/401, degrade graciosamente para sem membros
      if (mErr && (mErr.code === '42501' || mErr.code === '401' || String(mErr.message || '').toLowerCase().includes('permission denied') || String(mErr.message || '').toLowerCase().includes('unauthorized'))) {
        mData = []
        mErr = null
      }
      const mRows = ensureOk(mData, mErr) as any[]
      for (const m of mRows) {
        const lid = m.id_lista as string
        const name = (m.membro_nome ?? m.nome ?? '').trim()
        const phone = (m.id_membro ?? m.membro_phone ?? m.numero_whatsapp ?? '').toString()
        const current = membersByListId.get(lid) || { names: [], phones: [] }
        if (name) current.names.push(name)
        if (phone) current.phones.push(phone.replace(/\D/g, ''))
        membersByListId.set(lid, current)
      }
    }

    const mapRow = (r: any): ShoppingList => {
      const isShared = r.type ? r.type === 'shared' : !!r.lista_compartilhada
      const members = membersByListId.get(r.id ?? r.id_lista) || { names: [], phones: [] }
      return {
        id: r.id ?? r.id_lista,
        name: r.name ?? r.nome_da_lista,
        description: r.description ?? r.descricao ?? '',
        createdAt: r.createdAt ?? r.criada_em ?? new Date().toISOString(),
        userId: r.userId ?? r.id_criador,
        type: r.type ?? (isShared ? 'shared' : 'personal'),
        memberCount: r.memberCount ?? r.quantidade_pessoas ?? (members.names.length || 1),
        memberNames: members.names,
        memberPhones: members.phones,
        splitEnabled: r.splitEnabled ?? r.split_enabled ?? false,
        includeOwnerInSplit: r.includeOwnerInSplit ?? r.include_owner_in_split ?? false,
        allowMembersToInvite: r.allowMembersToInvite ?? r.allow_members_invite ?? false,
        items: Array.isArray(r.item_listas)
          ? (r.item_listas as any[]).map((li) => ({
              id: li.id,
              itemId: li.id_item,
              quantity: li.quantidade ?? 1,
              checked: !!li.marcado,
              price: li.preco_unitario ?? 0,
              unit: li.unidade ?? undefined,
              createdBy: undefined,
            })) as ListItem[]
          : [],
      }
    }

    const mapped = rows.map(mapRow)
    // ordena por data de criação desc
    mapped.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return mapped
  },

  async getList(id: string): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from(T.lists)
      .select('*, item_listas(*)')
      .eq('id_lista', id)
      .maybeSingle()
    const r = ensureOk(data, error) as any
    if (!r) throw new Error('Lista não encontrada')
    // Buscar membros desta lista (com fallback de tabela)
    let mData: any = null
    let mErr: any = null
    {
      const resp = await supabase
        .from(T.listMembers)
        .select('*')
        .eq('id_lista', r.id_lista ?? r.id)
      mData = resp.data; mErr = resp.error
    }
    if (mErr && mErr.code === 'PGRST205') {
      const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
      const resp2 = await supabase
        .from(ALT)
        .select('*')
        .eq('id_lista', r.id_lista ?? r.id)
      mData = resp2.data; mErr = resp2.error
      if (!mErr) {
        ;(T as any).listMembers = ALT
      }
    }
    // Se não houver permissão/401, degrade para vazio
    if (mErr && (mErr.code === '42501' || mErr.code === '401' || String(mErr.message || '').toLowerCase().includes('permission denied') || String(mErr.message || '').toLowerCase().includes('unauthorized'))) {
      mData = []
      mErr = null
    }
    const mRows = ensureOk(mData, mErr) as any[]
    const memberNames = mRows.map(m => (m.membro_nome ?? m.nome ?? '').trim()).filter(Boolean)
    const memberPhones = mRows.map(m => (m.id_membro ?? m.membro_phone ?? m.numero_whatsapp ?? '').toString().replace(/\D/g, '')).filter(Boolean)
    const isShared = r.type ? r.type === 'shared' : !!r.lista_compartilhada
    return {
      id: r.id_lista ?? r.id,
      name: r.nome_da_lista ?? r.name,
      description: r.descricao ?? r.description ?? '',
      createdAt: r.criada_em ?? r.createdAt ?? new Date().toISOString(),
      userId: r.id_criador ?? r.userId,
      type: r.type ?? (isShared ? 'shared' : 'personal'),
      memberCount: r.quantidade_pessoas ?? r.memberCount ?? (memberNames.length || 1),
      memberNames,
      memberPhones,
      splitEnabled: r.split_enabled ?? r.splitEnabled ?? false,
      includeOwnerInSplit: r.include_owner_in_split ?? r.includeOwnerInSplit ?? false,
      allowMembersToInvite: r.allow_members_invite ?? r.allowMembersToInvite ?? false,
      items: Array.isArray(r.item_listas)
        ? (r.item_listas as any[]).map((li) => ({
            id: li.id,
            itemId: li.id_item,
            quantity: li.quantidade ?? 1,
            checked: !!li.marcado,
            price: li.preco_unitario ?? 0,
            unit: li.unidade ?? undefined,
            createdBy: undefined,
          })) as ListItem[]
        : [],
    }
  },

  async updateList(id: string, patch: Partial<ShoppingList>): Promise<ShoppingList> {
    const mapped: any = {
      nome_da_lista: patch.name,
      descricao: patch.description,
      lista_pessoal: patch.type ? patch.type === 'personal' : undefined,
      lista_compartilhada: patch.type ? patch.type === 'shared' : undefined,
      split_enabled: patch.splitEnabled,
      include_owner_in_split: patch.includeOwnerInSplit,
      allow_members_invite: patch.allowMembersToInvite,
      quantidade_pessoas: patch.memberCount,
    }
    Object.keys(mapped).forEach(k => mapped[k] === undefined && delete mapped[k])
    const { data, error } = await supabase
      .from(T.lists)
      .update(mapped)
      .eq('id_lista', id)
      .select('*, item_listas(*)')
      .single()
    const r = ensureOk(data, error) as any

    // Sincronizar membros na tabela de membros quando arrays forem enviados
    if (patch.memberNames || patch.memberPhones) {
      const names = (patch.memberNames || []).map(n => (n || '').trim())
      const phones = (patch.memberPhones || []).map(p => (p || '').toString().replace(/\D/g, ''))
      // Estratégia simples: apagar e re-inserir para refletir o estado atual
      let delErr: any = null
      {
        const resp = await supabase.from(T.listMembers).delete().eq('id_lista', id)
        delErr = resp.error
      }
      if (delErr && delErr.code === 'PGRST205') {
        const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
        const resp2 = await supabase.from(ALT).delete().eq('id_lista', id)
        if (!resp2.error) {
          ;(T as any).listMembers = ALT
        }
        delErr = resp2.error
      }
      if (delErr) {
        // Se não houver permissão, não interromper o fluxo
        if (!(delErr.code === '42501' || delErr.code === '401' || String(delErr.message || '').toLowerCase().includes('permission denied') || String(delErr.message || '').toLowerCase().includes('unauthorized'))) {
          throw delErr
        }
      }
      const rowsToInsert: any[] = []
      const max = Math.max(names.length, phones.length)
      for (let i = 0; i < max; i++) {
        const nome = names[i] || names[i % names.length] || null
        const phone = phones[i] || null
        if (!nome && !phone) continue
        rowsToInsert.push({ id_lista: id, membro_nome: nome, id_membro: phone })
      }
      if (rowsToInsert.length > 0) {
        let insErr: any = null
        {
          const resp = await supabase.from(T.listMembers).insert(rowsToInsert)
          insErr = resp.error
        }
        if (insErr && insErr.code === 'PGRST205') {
          const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
          const resp2 = await supabase.from(ALT).insert(rowsToInsert)
          if (!resp2.error) {
            ;(T as any).listMembers = ALT
          }
          insErr = resp2.error
        }
        if (insErr) {
          if (!(insErr.code === '42501' || String(insErr.message || '').toLowerCase().includes('permission denied'))) {
            throw insErr
          }
        }
      }
    }

    const isShared = !!r.lista_compartilhada
    // Carregar membros atualizados para retorno consistente
    // Recarregar membros e retornar objeto unificado
    {
      let mData2: any = null
      let mErr2: any = null
      const resp = await supabase
        .from(T.listMembers)
        .select('*')
        .eq('id_lista', r.id_lista)
      mData2 = resp.data; mErr2 = resp.error
      if (mErr2 && mErr2.code === 'PGRST205') {
        const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
        const resp2 = await supabase
          .from(ALT)
          .select('*')
          .eq('id_lista', r.id_lista)
        mData2 = resp2.data; mErr2 = resp2.error
        if (!mErr2) {
          ;(T as any).listMembers = ALT
        }
      }
      if (mErr2 && (mErr2.code === '42501' || mErr2.code === '401' || String(mErr2.message || '').toLowerCase().includes('permission denied') || String(mErr2.message || '').toLowerCase().includes('unauthorized'))) {
        mData2 = []
        mErr2 = null
      }
      const mRows2 = ensureOk(mData2, mErr2) as any[]
      const memberNames2 = mRows2.map(m => (m.membro_nome ?? m.nome ?? '').trim()).filter(Boolean)
      const memberPhones2 = mRows2.map(m => (m.id_membro ?? m.membro_phone ?? m.numero_whatsapp ?? '').toString().replace(/\D/g, '')).filter(Boolean)
      return {
        id: r.id_lista,
        name: r.nome_da_lista,
        description: r.descricao ?? '',
        createdAt: r.criada_em,
        userId: r.id_criador,
        type: isShared ? 'shared' : 'personal',
        memberCount: r.quantidade_pessoas ?? (memberNames2.length || 1),
        memberNames: memberNames2,
        memberPhones: memberPhones2,
        splitEnabled: r.split_enabled ?? false,
        includeOwnerInSplit: r.include_owner_in_split ?? false,
        allowMembersToInvite: r.allow_members_invite ?? false,
        items: Array.isArray(r.item_listas)
          ? (r.item_listas as any[]).map((li) => ({
              id: li.id,
              itemId: li.id_item,
              quantity: li.quantidade ?? 1,
              checked: !!li.marcado,
              price: li.preco_unitario ?? 0,
              unit: li.unidade ?? undefined,
              createdBy: undefined,
            })) as ListItem[]
          : [],
      }
    }
  },

  async promoteListToShared(id: string): Promise<ShoppingList> {
    // No Supabase, apenas garantir type='shared'
    return this.updateList(id, { type: 'shared' })
  },

  async createList(payload: {
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
    const isShared = (payload.type ?? 'personal') === 'shared'
    const { data, error } = await supabase
      .from(T.lists)
      .insert({
        nome_da_lista: payload.name,
        descricao: payload.description ?? '',
        id_criador: payload.userId,
        lista_pessoal: !isShared,
        lista_compartilhada: isShared,
        quantidade_pessoas: payload.memberCount ?? 1,
        split_enabled: payload.splitEnabled ?? false,
        include_owner_in_split: payload.includeOwnerInSplit ?? false,
        allow_members_invite: false,
      })
      .select('*, item_listas(*)')
      .single()
    const list = ensureOk(data, error) as any
    // inserir itens iniciais se existir
    if ((payload.initialItems || []).length > 0) {
      const uid = payload.userId
      const toInsert = (payload.initialItems || []).map((itemId) => ({
        id_lista: list.id_lista,
        id_item: itemId,
        id_usuario: uid,
        quantidade: 1,
        marcado: false,
        preco_unitario: 0,
      }))
      const { error: liErr } = await supabase.from(T.listItems).insert(toInsert)
      if (liErr) throw liErr
    }
    // Inserir membros iniciais, se fornecido
    if ((payload.memberNames && payload.memberNames.length > 0) || (payload.memberPhones && payload.memberPhones.length > 0)) {
      const names = (payload.memberNames || []).map(n => (n || '').trim())
      const phones = (payload.memberPhones || []).map(p => (p || '').toString().replace(/\D/g, ''))
      const max = Math.max(names.length, phones.length)
      const rowsToInsert: any[] = []
      for (let i = 0; i < max; i++) {
        const nome = names[i] || names[i % names.length] || null
        const phone = phones[i] || null
        if (!nome && !phone) continue
        rowsToInsert.push({ id_lista: list.id_lista, membro_nome: nome, id_membro: phone })
      }
      if (rowsToInsert.length > 0) {
        let mErr: any = null
        {
          const resp = await supabase.from(T.listMembers).insert(rowsToInsert)
          mErr = resp.error
        }
        if (mErr && mErr.code === 'PGRST205') {
          const ALT = T.listMembers === 'membros_lista' ? 'membro_listas' : 'membros_lista'
          const resp2 = await supabase.from(ALT).insert(rowsToInsert)
          if (!resp2.error) {
            ;(T as any).listMembers = ALT
          }
          mErr = resp2.error
        }
        if (mErr) throw mErr
      }
    }
    return this.getList(list.id_lista)
  },

  async addItemToList(listId: string, item: { itemId: string; quantity?: number; price?: number; checked?: boolean; unit?: 'unidade' | 'peso'; createdBy?: string }): Promise<ShoppingList> {
    const uid = (JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id) as string | undefined
    const { error } = await supabase.from(T.listItems).insert({
      id_lista: listId,
      id_item: item.itemId,
      id_usuario: uid,
      quantidade: item.quantity ?? 1,
      marcado: item.checked ?? false,
      preco_unitario: item.price ?? 0,
      unidade: item.unit,
    })
    if (error) throw error
    return this.getList(listId)
  },

  async updateListItem(listId: string, listItemId: string, patch: Partial<ListItem>): Promise<ShoppingList> {
    const mapped: any = {
      quantidade: patch.quantity,
      marcado: patch.checked,
      preco_unitario: patch.price,
      unidade: patch.unit,
    }
    Object.keys(mapped).forEach(k => mapped[k] === undefined && delete mapped[k])
    const { error } = await supabase.from(T.listItems).update(mapped).eq('id', listItemId)
    if (error) throw error
    return this.getList(listId)
  },

  async toggleListItem(listId: string, listItemId: string, checked: boolean): Promise<ShoppingList> {
    const { error } = await supabase.from(T.listItems).update({ marcado: checked }).eq('id', listItemId)
    if (error) throw error
    return this.getList(listId)
  },

  async deleteListItem(listId: string, listItemId: string): Promise<ShoppingList> {
    const { error } = await supabase.from(T.listItems).delete().eq('id', listItemId)
    if (error) throw error
    return this.getList(listId)
  },

  async deleteList(listId: string): Promise<void> {
    // deletar itens ligados à lista primeiro (se FK não estiver ON DELETE CASCADE)
    await supabase.from(T.listItems).delete().eq('id_lista', listId)
    const { error } = await supabase.from(T.lists).delete().eq('id_lista', listId)
    if (error) throw error
  },

  async updateMemberChargeStatus(listId: string, memberName: string, status: 'pendente'|'cobrado'|'pago', proofName?: string): Promise<ShoppingList> {
    // Atualiza campo JSON charges.byMember
    const { data: list, error } = await supabase.from(T.lists).select('id, charges').eq('id', listId).single()
    if (error) throw error
    const byMember: { name: string; status: 'pendente'|'cobrado'|'pago'; proofName?: string }[] =
      (list?.charges?.byMember as any[]) || []
    const idx = byMember.findIndex(m => m.name === memberName)
    if (idx === -1) byMember.push({ name: memberName, status, proofName })
    else byMember[idx] = { ...byMember[idx], status, proofName }
    const { data, error: upErr } = await supabase
      .from(T.lists)
      .update({ charges: { byMember } })
      .eq('id', listId)
      .select('*, items:list_items(*)')
      .single()
    const r = ensureOk(data, upErr) as any
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
      userId: r.userId,
      type: r.type,
      memberCount: r.memberCount,
      memberNames: r.memberNames,
      memberPhones: r.memberPhones,
      splitEnabled: r.splitEnabled,
      includeOwnerInSplit: r.includeOwnerInSplit,
      allowMembersToInvite: r.allowMembersToInvite,
      items: (r.items || []).map((li: any) => ({
        id: li.id,
        itemId: li.itemId,
        quantity: li.quantity,
        checked: li.checked,
        price: li.price,
        unit: li.unit,
        createdBy: li.createdBy,
      })) as ListItem[],
    }
  },

  resetAll(): void {
    // noop no supabase
  },
}

