
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, Split, DollarSign, Settings, Search, X as XIcon, ChevronDown, Link as LinkIcon } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SuccessModal } from '../../components/SuccessModal'
import { ItemRow } from '../../components/ItemRow'
import { EditListItemModal } from '../../components/EditListItemModal'
import { SearchInput } from '../../components/SearchInput'
import { AddMember } from '../../components/AddMember'
import { AddItemForm } from '../../components/AddItemForm'
import { PixChargeModal } from '../../components/PixChargeModal'
// duplicate import removed
import { EditListSettingsModal } from '../../components/EditListSettingsModal'
import { storage, type Item as StorageItem, type Category as StorageCategory, type ShoppingList } from '../../lib/storage'
import { useSession } from '../../lib/session'

type Item = { id: string; name: string; checked: boolean; qty?: number; price?: number; category?: string; categoryId?: string; categoryColor?: string; unit?: string }
type Member = { id: string; name: string }

export function ListDetailPage(){
  const { id } = useParams()
  const { user } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [listData, setListData] = useState<ShoppingList | null>(null)
  const [q, setQ] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ open: boolean; id?: string }>({ open: false })
  const [editingListItem, setEditingListItem] = useState<any>(null)
  const [confirmDeleteList, setConfirmDeleteList] = useState(false)
  const [showEditList, setShowEditList] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leftSuccess, setLeftSuccess] = useState(false)
  // removed explicit delete list button per request

  useEffect(()=>{
    if (id) {
      loadListDetail()
    }
  },[id])

  async function loadListDetail() {
    try {
      const [list, allItems, categories] = await Promise.all([
        storage.getList(id!),
        storage.getItems(),
        storage.getCategories()
      ])
      setListData(list)
      // splitEnabled tratado via listData
      // hidratar membros a partir da lista persistida
      if (Array.isArray(list.memberNames)) {
        setMembers(list.memberNames.map((name, idx) => ({ id: `${idx}`, name })))
      }
      const catMetaById = new Map(categories.map(c => [c.id, { name: c.name, color: c.color }]))
      const itemById = new Map(allItems.map(i => [i.id, i]))
      const listItems = list.items.map((listItem: any) => {
        const itemInfo = itemById.get(listItem.itemId)
        const meta = itemInfo ? catMetaById.get(itemInfo.categoryId) : undefined
        return {
          id: listItem.id,
          name: itemInfo?.name || 'Item não encontrado',
          checked: listItem.checked,
          qty: listItem.quantity,
          price: listItem.price,
          unit: listItem.unit || (itemInfo?.defaultUnit as any) || 'unidade',
          category: meta?.name,
          categoryId: itemInfo?.categoryId,
          categoryColor: meta?.color,
        }
      })
      setItems(listItems)
    } catch (error) {
      console.error('Erro ao carregar lista:', error)
    } finally {
      setLoading(false)
    }
  }

  // Observação: status de cobrança/pagamento fica apenas na tela de Contas

  const totals = useMemo(()=>{
    const total = items.reduce((s,i)=> s + ((i.price||0) * (i.qty||1)), 0)
    const real = items.filter(i=>i.checked).reduce((s,i)=> s + ((i.price||0) * (i.qty||1)), 0)
    const progress = items.length ? Math.round(100 * items.filter(i=>i.checked).length / items.length) : 0
    const splitEnabledNow = listData?.type === 'shared' && !!listData?.splitEnabled
    const participantCount = splitEnabledNow ? (members.length + (listData?.includeOwnerInSplit ? 1 : 0)) : 0
    const porPessoa = splitEnabledNow && participantCount > 0 ? real / participantCount : undefined
    return { total, real, progress, porPessoa, participants: participantCount }
  },[items, listData?.splitEnabled, listData?.includeOwnerInSplit, members])

  async function toggle(listItemId:string, v:boolean){
    try {
      await storage.toggleListItem(id!, listItemId, v)
      await loadListDetail()
    } catch (e) {
      console.error('Erro ao atualizar item da lista:', e)
    }
  }

  async function handleAddMember(nameOrPhone: string) {
    // tentar resolver para nome de contato quando vier telefone
    const contacts = await storage.getContacts()
    const digits = nameOrPhone.replace(/\D/g, '')
    const match = digits ? contacts.find(c => c.phone.replace(/\D/g,'') === digits) : undefined
    const memberNameToStore = match?.name || nameOrPhone

    const newMember: Member = { id: Date.now().toString(), name: memberNameToStore }
    setMembers(prev => [...prev, newMember])
    if (listData) {
      const names = [...(listData.memberNames||[]), memberNameToStore]
      const phones = [...(listData.memberPhones||[])]
      if (digits) phones.push(digits)
      // salvar membros e telefones
      let updated = await storage.updateList(listData.id, { memberNames: names, memberPhones: phones, memberCount: names.length, type: 'shared' })
      // promover para o store compartilhado (idempotente): garante visibilidade para o membro
      updated = await storage.promoteListToShared(listData.id)
      setListData(updated)
    }
  }

  async function handleRemoveMember(id: string) {
    const removed = members.find(m => m.id === id)
    const next = members.filter(m => m.id !== id)
    setMembers(next)
    if (listData) {
      const names = next.map(m => m.name)
      const removedDigits = removed?.name ? removed.name.replace(/\D/g, '') : ''
      const phones = (listData.memberPhones || []).filter(p => p !== removedDigits)
      const updated = await storage.updateList(listData.id, { memberNames: names, memberPhones: phones, memberCount: names.length })
      setListData(updated)
    }
  }

  async function handleAddItem(itemData: { itemId?: string; name: string; categoryId?: string; price?: number; qty?: number; unit?: string }) {
    try {
      let itemId = itemData.itemId
      if (!itemId) {
        // criar item novo
        const created = await storage.createItem({
          name: itemData.name,
          categoryId: itemData.categoryId || '',
          price: typeof itemData.price === 'number' ? itemData.price : undefined,
          defaultUnit: (itemData.unit as any) || 'unidade',
          defaultQty: typeof itemData.qty === 'number' ? itemData.qty : 1,
        })
        itemId = created.id
      }
      const createdBy = user?.name
      await storage.addItemToList(id!, { itemId, quantity: itemData.qty, price: itemData.price, unit: (itemData.unit as any), createdBy })
      await loadListDetail()
    } catch (e) {
      console.error('Erro ao adicionar item à lista:', e)
    }
  }

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filteredItems = items.filter(item => 
    normalize(item.name).includes(normalize(q))
  )

  // Agrupar por categoria para render e lógica de abrir/fechar
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; color?: string; items: Item[] }>()
    for (const it of filteredItems) {
      const key = it.category || 'Sem categoria'
      if (!map.has(key)) map.set(key, { name: key, color: it.categoryColor, items: [] })
      map.get(key)!.items.push(it)
    }
    return Array.from(map.values())
  }, [filteredItems])

  // Abrir categorias por padrão e minimizar automaticamente quando concluídas
  useEffect(() => {
    setOpenCats(prev => {
      const next = { ...prev }
      for (const g of groups) {
        const allChecked = g.items.length > 0 && g.items.every(i => !!i.checked)
        // Se ainda não existe estado, definir: aberto por padrão; mas se já vier concluída, fechar por padrão
        if (next[g.name] === undefined) {
          next[g.name] = allChecked ? false : true
        }
        // Não forçar fechar novamente se o usuário reabrir manualmente
      }
      return next
    })
  }, [groups])

  // Verificar se o usuário atual é o dono da lista ou membro (por nome ou telefone)
  const isOwner = listData?.userId === user?.id
  const myDigits = (user?.phone || '').replace(/\D/g, '')
  const isMember = !!listData && (
    listData.type !== 'shared'
      ? isOwner
      : ((listData.memberNames || []).includes(user?.name || '') || (listData.memberPhones || []).includes(myDigits))
  )
  const isNonParticipant = !!listData && listData.type === 'shared' && !isOwner && !isMember

  const [copied, setCopied] = useState(false)

  function shareList() {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(()=>{
      setCopied(true)
      window.setTimeout(()=> setCopied(false), 1500)
    }).catch(()=>{
      prompt('Copie o link da lista:', url)
    })
  }

  async function leaveList() {
    if (!listData || !user) return
    const myDigits = (user.phone || '').replace(/\D/g, '')
    const nextNames = (listData.memberNames||[]).filter(n => n !== user.name)
    const nextPhones = (listData.memberPhones||[]).filter(p => p !== myDigits)
    const updated = await storage.updateList(listData.id, { memberNames: nextNames, memberPhones: nextPhones, memberCount: nextNames.length })
    setListData(updated)
    setLeftSuccess(true)
    setTimeout(()=>{
      window.history.back()
    }, 300)
  }

  // Verificar se pode cobrar (divisão ativa, gastos e itens marcados)
  const canCharge = isOwner && listData?.type === 'shared' && !!listData?.splitEnabled && items.some(i => i.checked) && totals.real > 0

  if (loading) {
    return (
      <div className="pt-4">
        <div className="text-center py-8 text-neutral-500">
          Carregando lista...
        </div>
      </div>
    )
  }

  if (!listData) {
    return (
      <div className="pt-4">
        <div className="text-center py-8 text-neutral-500">
          Lista não encontrada
        </div>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Header compacto focado no progresso */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{listData.name}</h1>
            {listData.description && <p className="text-xs text-gray-500">{listData.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {!isNonParticipant && (
              <div className="relative">
                <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" onClick={shareList} title="Copiar link da lista">
                  <LinkIcon size={18} className="text-gray-700" />
                </button>
                {copied && (
                  <span className="absolute -top-2 right-0 translate-y-[-100%] text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full shadow">Copiado!</span>
                )}
              </div>
            )}
            {isOwner && (
              <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" onClick={()=>setShowEditList(true)}>
                <Settings size={18} className="text-gray-700" />
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progresso</span>
            <span className="text-sm font-semibold text-green-600">{totals.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill transition-all duration-500 ease-out" style={{ width: `${totals.progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{items.filter(i => i.checked).length} de {items.length} itens</span>
            <span>R$ {totals.real.toFixed(2)} de R$ {totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Seção de Membros - aparece somente para listas compartilhadas (esconde se não participante) */}
      {listData.type === 'shared' && !isNonParticipant && (
        <div className="card">
          <AddMember
            members={members}
            onAddMember={(name)=>{
              if (!isOwner && !listData?.allowMembersToInvite) {
                alert('Somente o dono da lista pode adicionar membros.')
                return
              }
              handleAddMember(name)
            }}
            onRemoveMember={handleRemoveMember}
            allowRemove={isOwner}
            canAdd={isOwner || !!listData?.allowMembersToInvite}
          />
        </div>
      )}
      

      {/* Seção de Adicionar Item (compacto estilo membros) - oculta se não participante */}
      {!isNonParticipant && (
      <div className="card space-y-3">
        {showSearch && (
          <div className="relative">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar item na lista..." />
            <button
              type="button"
              aria-label="Fechar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowSearch(false)}
            >
              <XIcon size={18} />
            </button>
          </div>
        )}
        <AddItemForm
          onAddItem={handleAddItem}
          isExpanded={true}
          onToggleExpanded={() => {}}
          hideCollapsedButton
          compact
          itemsCount={items.length}
        />
      </div>
      )}

      {/* Lista de Itens - por categoria minimizada */}
      {isNonParticipant ? (
        <div className="card">
          <div className="text-center text-gray-500 py-8">Você não participa desta lista. O conteúdo está oculto.</div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Nenhum item ainda</h3>
          <p className="text-gray-500 text-sm">Adicione itens à sua lista para começar a organizar suas compras</p>
        </div>
      ) : (
        (()=>{
          return (
            <div className="space-y-3">
              {groups.map(group => {
                const catName = group.name
                const open = !!openCats[catName]
                const allChecked = group.items.length > 0 && group.items.every(i => !!i.checked)
                return (
                <div key={catName} className="card">
                  <div className="py-2 px-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color || '#e5e7eb' }} />
                      <span className={`text-sm font-semibold ${allChecked ? 'line-through text-gray-400' : 'text-gray-900'}`}>{catName}</span>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={()=> setOpenCats(prev=>({ ...prev, [catName]: !prev[catName] }))}
                      aria-label={open ? 'Minimizar categoria' : 'Expandir categoria'}
                    >
                      <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {open && group.items.map(i => (
                    <button key={i.id} className="w-full text-left" onClick={()=>setEditingListItem(i)}>
                      <ItemRow 
                        name={i.name}
                        checked={i.checked}
                        qty={i.qty}
                        price={i.price}
                        category={i.category}
                        unit={i.unit}
                        createdBy={i as any as { createdBy?: string } && (i as any).createdBy}
                        onToggle={(v)=>toggle(i.id, v)}
                      />
                    </button>
                  ))}
                </div>
              )})}
              {filteredItems.length === 0 && q && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum item encontrado para "{q}"</p>
                </div>
              )}
            </div>
          )
        })()
      )}

      {/* Toggle de dividir custos foi movido para o modal de configurações */}

      {/* Card de Valor Total - Fixo entre itens e ações abaixo (como antes) */}
      {!isNonParticipant && (
      <div className="card border border-green-100 sticky-safe-bottom bg-white z-10" style={{ 
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total Gasto</div>
          <div className="font-bold text-xl text-green-600">R$ {totals.real.toFixed(2)}</div>
        </div>
        {!!listData?.splitEnabled && totals.porPessoa !== undefined && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Por pessoa ({totals.participants} {totals.participants === 1 ? 'pessoa' : 'pessoas'})
            </div>
            <div className="font-semibold text-lg text-gray-900">R$ {totals.porPessoa.toFixed(2)}</div>
          </div>
        )}
        {items.filter(i => i.checked).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              {items.filter(i => i.checked).length} de {items.length} itens comprados • {totals.progress}% concluído
            </div>
          </div>
        )}
      </div>
      )}

      {/* Ações: Cobrar + Excluir lado a lado */}
      {!isNonParticipant && isOwner && (
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowPixModal(true)}
            disabled={!canCharge}
            className={`w-full py-3 px-4 rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${canCharge ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <DollarSign size={20} />
            <div className="text-center">
              <div className="text-sm font-semibold">Cobrar</div>
              {canCharge && listData?.splitEnabled && <div className="text-xs opacity-90">R$ {totals.porPessoa?.toFixed(2)}/pessoa</div>}
            </div>
          </button>
          <button className="btn-danger w-full py-3 rounded-xl" onClick={()=>setConfirmDeleteList(true)}>Excluir Lista</button>
        </div>
      </div>
      )}
      {!isNonParticipant && !isOwner && (
        <div className="px-4 pb-4">
          <button className="btn-secondary w-full py-3 rounded-xl" onClick={()=>setConfirmLeave(true)}>Sair da Lista</button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmLeave}
        title="Sair da lista"
        description="Tem certeza que deseja sair desta lista? Você não verá mais esta lista nas suas Listas."
        confirmLabel="Sair"
        onCancel={()=>setConfirmLeave(false)}
        onConfirm={async()=>{ setConfirmLeave(false); await leaveList() }}
      />
      <SuccessModal
        isOpen={leftSuccess}
        onClose={()=>setLeftSuccess(false)}
        title="Você saiu da lista"
        message="Esta lista não aparecerá mais nas suas Listas."
      />

      {/* Status de cobrança/pagamento foi movido para a tela de Contas */}

      {/* Ações: excluir lista removida conforme solicitado */}

      {/* Modal PIX */}
      <PixChargeModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        totalAmount={totals.real}
        memberCount={totals.participants || members.length}
        amountPerPerson={totals.porPessoa || 0}
        listName={listData?.name || 'Lista de Compras'}
        members={members}
        onCharged={async ()=>{
          if (!listData) return
          const byMember = (listData.memberNames||members.map(m=>m.name)).map(name => ({ name, status: 'cobrado' as const }))
          const updated = await storage.updateList(listData.id, { charges: { byMember } })
          setListData(updated)
        }}
      />

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmDeleteItem.open}
        title="Excluir item"
        description="Tem certeza que deseja excluir este item da lista?"
        confirmLabel="Excluir"
        onCancel={()=>setConfirmDeleteItem({ open: false })}
        onConfirm={async ()=>{
          if (confirmDeleteItem.id) {
            await storage.deleteListItem(id!, confirmDeleteItem.id)
            await loadListDetail()
          }
          setConfirmDeleteItem({ open: false })
        }}
      />
      <EditListItemModal
        isOpen={!!editingListItem}
        onClose={()=>setEditingListItem(null)}
        initial={editingListItem ? { id: editingListItem.id, name: editingListItem.name, quantity: editingListItem.qty||1, price: editingListItem.price||0, unit: editingListItem.unit as any } : null}
        onSave={async (patch)=>{ await storage.updateListItem(id!, patch.listItemId, { quantity: patch.quantity, price: patch.price, unit: patch.unit }); await loadListDetail() }}
        onDelete={async (listItemId)=>{ await storage.deleteListItem(id!, listItemId); await loadListDetail() }}
      />
      <EditListSettingsModal isOpen={showEditList} onClose={()=>setShowEditList(false)} list={listData} onSaved={(u)=>{ setListData(u) }} />

      <ConfirmDialog
        isOpen={confirmDeleteList}
        title="Excluir lista"
        description="Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onCancel={()=>setConfirmDeleteList(false)}
        onConfirm={async ()=>{
          await storage.deleteList(id!)
          window.history.back()
        }}
      />
      {/* ConfirmDialog de exclusão de lista removido */}
    </div>
  )
}
