
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, Split, DollarSign, Settings } from 'lucide-react'
import { ItemRow } from '../../components/ItemRow'
import { EditListItemModal } from '../../components/EditListItemModal'
import { SearchInput } from '../../components/SearchInput'
import { AddMember } from '../../components/AddMember'
import { AddItemForm } from '../../components/AddItemForm'
import { PixChargeModal } from '../../components/PixChargeModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EditListSettingsModal } from '../../components/EditListSettingsModal'
import { storage, type Item as StorageItem, type Category as StorageCategory, type ShoppingList } from '../../lib/storage'
import { useSession } from '../../lib/session'

type Item = { id: string; name: string; checked: boolean; qty?: number; price?: number; category?: string; unit?: string }
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
      const catById = new Map(categories.map(c => [c.id, c.name]))
      const itemById = new Map(allItems.map(i => [i.id, i]))
      const listItems = list.items.map((listItem: any) => {
        const itemInfo = itemById.get(listItem.itemId)
        return {
          id: listItem.id,
          name: itemInfo?.name || 'Item não encontrado',
          checked: listItem.checked,
          qty: listItem.quantity,
          price: listItem.price,
          unit: listItem.unit || (itemInfo?.defaultUnit as any) || 'unidade',
          category: itemInfo ? catById.get(itemInfo.categoryId) : undefined
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
    const newMember: Member = { id: Date.now().toString(), name: nameOrPhone }
    setMembers(prev => [...prev, newMember])
    if (listData) {
      const names = [...(listData.memberNames||[]), nameOrPhone]
      const updated = await storage.updateList(listData.id, { memberNames: names, memberCount: names.length, type: 'shared' })
      setListData(updated)
    }
  }

  async function handleRemoveMember(id: string) {
    const next = members.filter(m => m.id !== id)
    setMembers(next)
    if (listData) {
      const names = next.map(m => m.name)
      const updated = await storage.updateList(listData.id, { memberNames: names, memberCount: names.length })
      setListData(updated)
    }
  }

  async function handleAddItem(itemData: { itemId?: string; name: string; categoryId?: string; price?: number; qty?: number; unit?: string }) {
    try {
      let itemId = itemData.itemId
      if (!itemId) {
        // criar item novo
        const created = await storage.createItem({ name: itemData.name, categoryId: itemData.categoryId || '' })
        itemId = created.id
      }
      await storage.addItemToList(id!, { itemId, quantity: itemData.qty, price: itemData.price, unit: (itemData.unit as any) })
      await loadListDetail()
    } catch (e) {
      console.error('Erro ao adicionar item à lista:', e)
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(q.toLowerCase())
  )

  // Verificar se o usuário atual é o dono da lista
  const isOwner = listData?.userId === user?.id

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
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" onClick={()=>setShowEditList(true)}>
            <Settings size={18} className="text-gray-700" />
          </button>
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

      {/* Seção de Membros - aparece somente para listas compartilhadas */}
      {listData.type === 'shared' && (
        <div className="card">
          <AddMember
            members={members}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        </div>
      )}
      

      {/* Seção de Busca e Adicionar Item */}
      <div className="card space-y-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar item na lista..." />
        <AddItemForm
          onAddItem={handleAddItem}
          isExpanded={showAddItem}
          onToggleExpanded={() => setShowAddItem(prev => !prev)}
        />
      </div>

      {/* Lista de Itens */}
      {items.length === 0 ? (
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
        <div className="card">
          {filteredItems.map(i => (
            <button key={i.id} className="w-full text-left" onClick={()=>setEditingListItem(i)}>
              <ItemRow 
                name={i.name} 
                checked={i.checked} 
                qty={i.qty} 
                price={i.price}
                category={i.category}
                unit={i.unit}
                onToggle={(v)=>toggle(i.id, v)} 
              />
            </button>
          ))}
          {filteredItems.length === 0 && q && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum item encontrado para "{q}"</p>
            </div>
          )}
        </div>
      )}

      {/* Toggle de dividir custos foi movido para o modal de configurações */}

      {/* Card de Valor Total - Fixo entre itens e ações abaixo (como antes) */}
      <div className="card border border-green-100 sticky bottom-0 bg-white z-10" style={{ 
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

      {/* Ações: Cobrar + Excluir lado a lado */}
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
