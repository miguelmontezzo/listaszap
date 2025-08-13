
const DEV = import.meta.env.DEV
// Em dev, forçamos uso do proxy "/n8n" para evitar CORS, ignorando URLs absolutas de env
const BASE = DEV ? '/n8n' : (import.meta.env.VITE_N8N_BASE || '')
// Fallback agora aponta para a URL fornecida pelo usuário
const CREATE_LIST_WEBHOOK = DEV
  ? '/n8n/webhook/criarlista'
  : (import.meta.env.VITE_N8N_CREATE_LIST_WEBHOOK || `${BASE}/webhook/criarlista`)
const CONFIG_LISTS_WEBHOOK = DEV
  ? '/n8n/webhook/config-listas'
  : (import.meta.env.VITE_N8N_CONFIG_LISTS_WEBHOOK || `${BASE}/webhook/config-listas`)
const INSERT_ITEM_WEBHOOK = DEV
  ? '/n8n/webhook/inseriritemnalista'
  : (import.meta.env.VITE_N8N_INSERT_ITEM_WEBHOOK || `${BASE}/webhook/inseriritemnalista`)
const ADD_USER_LIST_WEBHOOK = DEV
  ? '/n8n/webhook/adduserlist'
  : (import.meta.env.VITE_N8N_ADD_USER_LIST_WEBHOOK || `${BASE}/webhook/adduserlist`)
const DELETE_OR_LEAVE_LIST_WEBHOOK = DEV
  ? '/n8n/webhook/escluirlista'
  : (import.meta.env.VITE_N8N_DELETE_OR_LEAVE_LIST_WEBHOOK || 'https://zzotech-n8n.lgctvv.easypanel.host/webhook/escluirlista')
const COBRAR_CONTA_WEBHOOK = DEV
  ? '/n8n/webhook/cobrarconta'
  : (import.meta.env.VITE_N8N_COBRAR_CONTA_WEBHOOK || 'https://zzotech-n8n.lgctvv.easypanel.host/webhook/cobrarconta')
const REMOVE_LIST_ITEM_WEBHOOK = DEV
  ? '/n8n/webhook/removeritemdalista'
  : (import.meta.env.VITE_N8N_REMOVE_LIST_ITEM_WEBHOOK || 'https://zzotech-n8n.lgctvv.easypanel.host/webhook/removeritemdalista')
const REMOVE_USER_LIST_WEBHOOK = DEV
  ? '/n8n/webhook/removeuserlist'
  : (import.meta.env.VITE_N8N_REMOVE_USER_LIST_WEBHOOK || 'https://zzotech-n8n.lgctvv.easypanel.host/webhook/removeuserlist')
const HEADERS = { 'Content-Type': 'application/json' }

async function post<T = any>(path: string, body: any): Promise<T> {
  const url = `${BASE}${path}`
  const isAbsolute = /^https?:\/\//i.test(url)
  const r = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
    ...(isAbsolute ? { mode: 'cors', credentials: 'omit' } : {}),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return (await r.json()) as T
}

export const api = {
  // AUTH (genérico, mantido para futuras integrações)
  requestOtp: (phone: string) => post<{ requestId: string }>('/auth/request-otp', { phone }),
  verifyOtp: (requestId: string, code: string) =>
    post<{ token: string; user: { id: string; phone: string; name: string } }>('/auth/verify-otp', { requestId, code }),

  // AUTH (adaptação às webhooks já existentes no n8n)
  requestOtpZapLista: async (
    whatsapp: string,
    nome?: string
  ): Promise<{ success: boolean; message?: string }> => {
    // Endpoint via webhook (evita CORS e padroniza com n8n)
    const url = `${BASE}/webhook/auth/enviar-codigo`
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] enviar-codigo via', url, { whatsapp, nome })
    }
    const digits = String(whatsapp || '').replace(/\D/g, '')
    const canonical = digits.startsWith('55') ? digits : `55${digits}`
    const e164 = `+${canonical}`
    const bodyPayload: any = {
      whatsapp: canonical,
      nome: nome || 'Usuário',
      // sinônimos comuns
      phone: canonical,
      telefone: canonical,
      numero: canonical,
      e164,
      name: nome || 'Usuário',
    }
    const r = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(bodyPayload) })
    let parsed: any = null
    try {
      const text = await r.text()
      try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
      // A API pode responder com um array contendo { success: true, data: {...} }
      if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0]
      if (typeof parsed?.response === 'string') parsed = JSON.parse(parsed.response)
    } catch {}
    const message = typeof parsed?.message === 'string' ? parsed.message : undefined
    const flag = typeof parsed?.success === 'boolean' ? parsed.success : undefined
    if (flag === false || (message && /usu[áa]rio n[aã]o existe/i.test(message))) {
      return { success: false, message }
    }
    if (r.ok) return { success: true, message }
    const errDetail = typeof parsed === 'string' ? parsed : (parsed?.error || parsed?.message || JSON.stringify(parsed))
    // eslint-disable-next-line no-console
    console.error('[Webhook] enviar-codigo erro', r.status, errDetail)
    throw new Error(message || errDetail || `HTTP ${r.status}`)
  },

  createUserZapLista: async (
    whatsapp: string,
    nome: string
  ): Promise<{ success: boolean; message?: string }> => {
    const url = `${BASE}/webhook/criar-usuario`
    const digits = String(whatsapp || '').replace(/\D/g, '')
    const canonical = digits.startsWith('55') ? digits : `55${digits}`
    const e164 = `+${canonical}`
    const bodyPayload: any = {
      whatsapp: canonical,
      nome,
      // sinônimos
      phone: canonical,
      telefone: canonical,
      numero: canonical,
      e164,
      name: nome,
    }
    const r = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(bodyPayload) })
    let payload: any = null
    try {
      const text = await r.text()
      try { payload = text ? JSON.parse(text) : null } catch { payload = text }
      if (Array.isArray(payload) && payload.length > 0) payload = payload[0]
      if (typeof payload?.response === 'string') payload = JSON.parse(payload.response)
    } catch {}
    const message = typeof payload?.message === 'string' ? payload.message : undefined
    const flag = typeof payload?.success === 'boolean' ? payload.success : undefined
    if (flag === false) return { success: false, message }
    if (r.ok) return { success: true, message }
    const errDetail = typeof payload === 'string' ? payload : (payload?.error || payload?.message || JSON.stringify(payload))
    // eslint-disable-next-line no-console
    console.error('[Webhook] criar-usuario erro', r.status, errDetail)
    throw new Error(message || errDetail || `HTTP ${r.status}`)
  },
  criarListaViaWebhook: async (payload: any): Promise<{ success: boolean; id?: string; message?: string }> => {
    const url = CREATE_LIST_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] criando lista via', url, payload)
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, {
      method: 'POST',
      ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }),
      headers: HEADERS,
      body: JSON.stringify(payload),
    })
    let body: any = null
    try {
      const text = await r.text()
      try { body = text ? JSON.parse(text) : null } catch { body = text }
      if (typeof body?.response === 'string') body = JSON.parse(body.response)
    } catch {}
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, id: body?.id, message: body?.message }
  },

  configurarListaViaWebhook: async (
    payload: {
      id_lista: string
      nome?: string
      descricao?: string
      pessoal?: boolean
      compartilhada?: boolean
      split_enabled?: boolean
      include_owner_in_split?: boolean
      allow_members_invite?: boolean
    }
  ): Promise<{ success: boolean; message?: string }> => {
    const url = CONFIG_LISTS_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] configurando lista via', url, payload)
    }
    // Enrich payload com sinônimos e userId (quando disponível)
    const userId = (() => {
      try { return JSON.parse(localStorage.getItem('lz_session') || '{}')?.user?.id } catch { return undefined }
    })()
    const finalPayload: any = {
      ...payload,
      // IDs
      id: payload.id_lista,
      idLista: payload.id_lista,
      userId,
      // nomes/descrições
      name: payload.nome,
      description: payload.descricao,
      // booleans duplicados em snake_case e camelCase
      splitEnabled: payload.split_enabled,
      includeOwnerInSplit: payload.include_owner_in_split,
      allowMembersToInvite: payload.allow_members_invite,
      // tipo derivado
      type: payload.compartilhada ? 'shared' : 'personal',
    }

    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, {
      method: 'POST',
      ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }),
      headers: HEADERS,
      body: JSON.stringify(finalPayload),
    })
    let body: any = null
    try {
      const text = await r.text()
      try { body = text ? JSON.parse(text) : null } catch { body = text }
      if (typeof body?.response === 'string') body = JSON.parse(body.response)
    } catch {}
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },

  inserirItemNaLista: async (payload: {
    id_lista: string
    id_item?: string
    nome?: string
    id_categoria?: string
    quantidade?: number
    preco_unitario?: number
    preco_total?: number
    unidade?: string
    criado_por?: string
    userId?: string
  }): Promise<{ success: boolean; message?: string }> => {
    const url = INSERT_ITEM_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] inserir item via', url, payload)
    }
    // Enviar payload com sinônimos para maior compatibilidade
    const finalPayload: any = {
      ...payload,
      // IDs
      listId: payload.id_lista,
      itemId: payload.id_item,
      // Nomes
      name: payload.nome,
      nome_do_item: payload.nome,
      // Categoria
      categoryId: payload.id_categoria,
      id_da_categoria: payload.id_categoria,
      // Quantidade e preços
      quantity: payload.quantidade,
      quantidade: payload.quantidade,
      price: payload.preco_unitario,
      preco_unitario: payload.preco_unitario,
      preco_total: payload.preco_total,
      unit: payload.unidade,
      unidade: payload.unidade,
      // Autor
      createdBy: payload.criado_por,
      criado_por: payload.criado_por,
      created_by_id: payload.userId,
      // Metadados
      timestamp: new Date().toISOString(),
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, {
      method: 'POST',
      ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }),
      headers: HEADERS,
      body: JSON.stringify(finalPayload),
    })
    const text = await r.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (Array.isArray(body) && body.length > 0) body = body[0]
    if (typeof body?.response === 'string') body = JSON.parse(body.response)
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },

  addUserToList: async (payload: {
    id_lista: string
    membro_nome?: string
    membro_phone?: string
    userId?: string
  }): Promise<{ success: boolean; message?: string }> => {
    const url = ADD_USER_LIST_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] add user to list via', url, payload)
    }
    const digits = String(payload.membro_phone || '').replace(/\D/g, '')
    const canonical = digits.startsWith('55') ? digits : (digits ? `55${digits}` : undefined)
    const finalPayload: any = {
      ...payload,
      listId: payload.id_lista,
      memberName: payload.membro_nome,
      memberPhone: canonical,
      telefone: canonical,
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, {
      method: 'POST',
      ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }),
      headers: HEADERS,
      body: JSON.stringify(finalPayload),
    })
    const text = await r.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (Array.isArray(body) && body.length > 0) body = body[0]
    if (typeof body?.response === 'string') body = JSON.parse(body.response)
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },

  removeUserFromList: async (payload: {
    id_lista: string
    membro_nome?: string
    membro_phone?: string
    owner_id?: string
    member_id?: string
    userId?: string
  }): Promise<{ success: boolean; message?: string }> => {
    const url = REMOVE_USER_LIST_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] remove user from list via', url, payload)
    }
    const digits = String(payload.membro_phone || payload.member_id || '').replace(/\D/g, '')
    const canonical = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : undefined
    const ownerDigits = String(payload.owner_id || '').replace(/\D/g, '')
    const ownerCanonical = ownerDigits ? (ownerDigits.startsWith('55') ? ownerDigits : `55${ownerDigits}`) : undefined
    const finalPayload: any = {
      ...payload,
      listId: payload.id_lista,
      memberName: payload.membro_nome,
      memberPhone: canonical,
      telefone: canonical,
      memberId: canonical,
      id_membro: canonical,
      ownerId: ownerCanonical,
      id_criador: ownerCanonical,
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, { method: 'POST', ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }), headers: HEADERS, body: JSON.stringify(finalPayload) })
    const text = await r.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (Array.isArray(body) && body.length > 0) body = body[0]
    if (typeof body?.response === 'string') { try { body = JSON.parse(body.response) } catch {} }
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },

  excluirOuSairLista: async (payload: {
    id_lista: string
    userId?: string
    action?: 'excluir' | 'sair'
  }): Promise<{ success: boolean; message?: string }> => {
    const url = DELETE_OR_LEAVE_LIST_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] excluir/sair lista via', url, payload)
    }
    const finalPayload: any = {
      ...payload,
      // IDs e sinônimos
      id: payload.id_lista,
      idLista: payload.id_lista,
      listId: payload.id_lista,
      // ação (se suportado pelo fluxo n8n)
      action: payload.action,
      acao: payload.action,
      // metadados
      timestamp: new Date().toISOString(),
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, {
      method: 'POST',
      ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }),
      headers: HEADERS,
      body: JSON.stringify(finalPayload),
    })
    const text = await r.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (Array.isArray(body) && body.length > 0) body = body[0]
    if (typeof body?.response === 'string') {
      try { body = JSON.parse(body.response) } catch {}
    }
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },

  cobrarConta: async (payload: {
    id_lista: string
    pix_key: string
    pix_key_type?: string
    valor_por_pessoa: number
    total_amount?: number
    participant_count?: number
    list_name?: string
    participantes?: { id?: string; nome?: string; phone?: string }[]
  }): Promise<{ success: boolean; message?: string }> => {
    const url = COBRAR_CONTA_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] cobrar conta via', url, payload)
    }
    const finalPayload: any = {
      ...payload,
      listId: payload.id_lista,
      amountPerPerson: payload.valor_por_pessoa,
      totalAmount: payload.total_amount,
      total: payload.total_amount,
      participantCount: payload.participant_count,
      participantsCount: payload.participant_count,
      participants: payload.participantes,
      pixKey: payload.pix_key,
      pixKeyType: payload.pix_key_type,
      listName: payload.list_name,
      timestamp: new Date().toISOString(),
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, { method: 'POST', ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }), headers: HEADERS, body: JSON.stringify(finalPayload) })
    const text = await r.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (Array.isArray(body) && body.length > 0) body = body[0]
    if (typeof body?.response === 'string') { try { body = JSON.parse(body.response) } catch {} }
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },

  removerItemDaLista: async (payload: {
    id_lista: string
    id_item_lista: string
    userId?: string
  }): Promise<{ success: boolean; message?: string }> => {
    const url = REMOVE_LIST_ITEM_WEBHOOK
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] remover item via', url, payload)
    }
    const finalPayload: any = {
      ...payload,
      listId: payload.id_lista,
      listItemId: payload.id_item_lista,
      id: payload.id_item_lista,
      timestamp: new Date().toISOString(),
    }
    const isProxied = url.startsWith('/n8n/')
    const r = await fetch(url, { method: 'POST', ...(isProxied ? {} : { mode: 'cors', credentials: 'omit' }), headers: HEADERS, body: JSON.stringify(finalPayload) })
    const text = await r.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (Array.isArray(body) && body.length > 0) body = body[0]
    if (typeof body?.response === 'string') { try { body = JSON.parse(body.response) } catch {} }
    if (!r.ok) {
      const msg = (typeof body === 'string' ? body : (body?.message || body?.error || JSON.stringify(body))) || `HTTP ${r.status}`
      throw new Error(msg)
    }
    return { success: true, message: body?.message }
  },
  verifyOtpZapLista: async (
    whatsapp: string,
    codigo: string
  ): Promise<{ token: string; user: { id: string; phone: string; name: string } }> => {
    const url = `${BASE}/webhook/auth/verificar-codigo`
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[Webhook] verificar-codigo via', url, { whatsapp, codigo })
    }
    const digits = String(whatsapp || '').replace(/\D/g, '')
    const canonical = digits.startsWith('55') ? digits : `55${digits}`
    const e164 = `+${canonical}`
    const r = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify({ whatsapp: canonical, codigo, phone: canonical, telefone: canonical, numero: canonical, e164 }) })
    const text = await r.text()
    let payload: any = null
    try { payload = text ? JSON.parse(text) : null } catch { payload = text }
    if (Array.isArray(payload) && payload.length > 0) payload = payload[0]
    if (typeof payload?.response === 'string') payload = JSON.parse(payload.response)

    if (!payload?.success) {
      throw new Error(payload?.message || 'Código inválido ou expirado')
    }

    const usuario = payload.usuario || {}
    // ID da conta = próprio número de telefone (formato canônico com DDI 55)
    const digitsUser = String(usuario.whatsapp ?? whatsapp).replace(/\D/g, '')
    const canonicalPhone = digitsUser.startsWith('55') ? digitsUser : `55${digitsUser}`
    return {
      token: payload.token,
      user: {
        id: canonicalPhone,
        phone: canonicalPhone,
        name: String(usuario.nome ?? 'Usuário'),
      },
    }
  },

  // LISTAS (mantido como está — backend local/mock)
  createList: (payload: { name: string; type?: string; split?: boolean; members?: string[] }) =>
    post<{ id: string }>('/lists/create', payload),
  addItemToList: (
    listId: string,
    item: { itemId?: string; name?: string; qty?: number; price?: number; categoryId?: string }
  ) => post('/lists/add-item', { listId, ...item }),
  toggleItem: (listId: string, itemId: string, checked: boolean) =>
    post('/lists/toggle-item', { listId, itemId, checked }),
  updateListSettings: (listId: string, settings: { split?: boolean }) =>
    post('/lists/update-settings', { listId, settings }),
  addMember: (listId: string, phone: string) => post('/lists/add-member', { listId, phone }),

  // ITENS
  createItem: (name: string, categoryId?: string) => post<{ id: string }>('/items/create', { name, categoryId }),
  updateItem: (id: string, patch: any) => post('/items/update', { id, patch }),
  autocompleteItems: (q: string) => post<{ id: string; name: string }[]>('/items/autocomplete', { q }),
}
