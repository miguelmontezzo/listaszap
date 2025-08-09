
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, Split, DollarSign } from 'lucide-react'
import { ItemRow } from '../../components/ItemRow'
import { SearchInput } from '../../components/SearchInput'
import { AddMember } from '../../components/AddMember'
import { AddItemForm } from '../../components/AddItemForm'
import { PixChargeModal } from '../../components/PixChargeModal'
import { mockApi, mockItems, mockCategories, mockUser } from '../../lib/mockData'

type Item = { id: string; name: string; checked: boolean; qty?: number; price?: number; category?: string; unit?: string }
type Member = { id: string; name: string }

export function ListDetailPage(){
  const { id } = useParams()
  const [items, setItems] = useState<Item[]>([])
  const [listData, setListData] = useState<any>(null)
  const [q, setQ] = useState('')
  const [split, setSplit] = useState(true)
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' },
    { id: '3', name: 'Pedro Costa' }
  ])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)

  useEffect(()=>{
    if (id) {
      loadListDetail()
    }
  },[id])

  async function loadListDetail() {
    try {
      const list = await mockApi.getList(id!)
      setListData(list)
      
      // Mapear itens da lista com informações do item
      const listItems = list.items.map((listItem: any) => {
        const itemInfo = mockItems.find(item => item.id === listItem.itemId)
        const categoryInfo = mockCategories.find(cat => cat.id === itemInfo?.categoryId)
        return {
          id: listItem.id,
          name: itemInfo?.name || 'Item não encontrado',
          checked: listItem.checked,
          qty: listItem.quantity,
          price: listItem.price,
          category: categoryInfo?.name
        }
      })
      setItems(listItems)
    } catch (error) {
      console.error('Erro ao carregar lista:', error)
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(()=>{
    const total = items.reduce((s,i)=> s + ((i.price||0) * (i.qty||1)), 0)
    const real = items.filter(i=>i.checked).reduce((s,i)=> s + ((i.price||0) * (i.qty||1)), 0)
    const progress = items.length ? Math.round(100 * items.filter(i=>i.checked).length / items.length) : 0
    const porPessoa = split && members.length > 0 ? real / members.length : undefined
    return { total, real, progress, porPessoa }
  },[items, split, members])

  function toggle(id:string, v:boolean){
    setItems(prev => prev.map(i => i.id===id? {...i, checked: v}: i))
  }

  function handleAddMember(name: string) {
    const newMember: Member = {
      id: Date.now().toString(),
      name
    }
    setMembers(prev => [...prev, newMember])
  }

  function handleRemoveMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  function handleAddItem(itemData: { name: string; price?: number; category?: string; qty?: number; unit?: string }) {
    const newItem: Item = {
      id: Date.now().toString(),
      name: itemData.name,
      checked: false,
      qty: itemData.qty || 1,
      price: itemData.price,
      category: itemData.category ? mockCategories.find(c => c.id === itemData.category)?.name : undefined,
      unit: itemData.unit || 'unidade'
    }
    setItems(prev => [...prev, newItem])
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(q.toLowerCase())
  )

  // Verificar se o usuário atual é o dono da lista
  const isOwner = listData?.userId === mockUser.id

  // Verificar se pode cobrar (lista compartilhada com gastos e itens marcados)
  const canCharge = isOwner && split && items.some(i => i.checked) && totals.real > 0

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
      {/* Header da Lista */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{listData.name}</h1>
            {listData.description && (
              <p className="text-sm text-gray-600 mt-1">{listData.description}</p>
            )}
          </div>
        </div>

        {/* Tipo de Lista - Pessoal/Compartilhada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Lista
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                !split
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSplit(false)}
            >
              <Users size={20} className="mx-auto mb-1" />
              <div className="font-medium text-sm">Pessoal</div>
              <div className="text-xs text-gray-500">Só para mim</div>
            </button>
            
            <button
              type="button"
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                split
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSplit(true)}
            >
              <Split size={20} className="mx-auto mb-1" />
              <div className="font-medium text-sm">Compartilhada</div>
              <div className="text-xs text-gray-500">Com outras pessoas</div>
            </button>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progresso da Lista</span>
            <span className="text-sm font-semibold text-green-600">{totals.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill transition-all duration-500 ease-out"
              style={{ width: `${totals.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{items.filter(i => i.checked).length} de {items.length} itens</span>
            <span>R$ {totals.real.toFixed(2)} de R$ {totals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">R$ {totals.total.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Estimado</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">R$ {totals.real.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Gasto Real</div>
          </div>
        </div>
      </div>

      {/* Seção de Membros - só aparece se split estiver ativo */}
      {split && (
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
            <ItemRow 
              key={i.id} 
              name={i.name} 
              checked={i.checked} 
              qty={i.qty} 
              price={i.price}
              category={i.category}
              unit={i.unit}
              onToggle={(v)=>toggle(i.id, v)} 
            />
          ))}
          {filteredItems.length === 0 && q && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum item encontrado para "{q}"</p>
            </div>
          )}
        </div>
      )}

      {/* Card de Valor Total - Fixo entre itens e botão de cobrar */}
      <div className="card border border-green-100 sticky bottom-0 bg-white z-10" style={{ 
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total Gasto</div>
          <div className="font-bold text-xl text-green-600">R$ {totals.real.toFixed(2)}</div>
        </div>
        {split && totals.porPessoa !== undefined && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Por pessoa ({members.length} {members.length === 1 ? 'pessoa' : 'pessoas'})
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

      {/* Botão de Cobrar (só aparece para o dono da lista) */}
      {canCharge && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowPixModal(true)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-3 active:scale-95"
          >
            <DollarSign size={24} />
            <div className="text-center">
              <div className="text-lg">Cobrar Membros</div>
              <div className="text-sm opacity-90">R$ {totals.porPessoa?.toFixed(2)} por pessoa</div>
            </div>
          </button>
        </div>
      )}

      {/* Modal PIX */}
      <PixChargeModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        totalAmount={totals.real}
        memberCount={members.length}
        amountPerPerson={totals.porPessoa || 0}
        listName={listData?.name || 'Lista de Compras'}
        members={members}
      />
    </div>
  )
}
