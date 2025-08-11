import { useEffect, useMemo, useState } from 'react'
import { storage } from '../../lib/storage'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/session'

type ListItem = { id: string; itemId: string; quantity: number; checked: boolean; price: number }
type ShoppingList = {
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
  charges?: { byMember: { name: string; status: 'pendente'|'cobrado'|'pago'; proofName?: string }[] }
}

type AccountEntry = {
  listId: string
  listName: string
  amount: number
  participants: number
  perPerson: number
  isPaid?: boolean
}

export function AccountsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pagar' | 'receber'>('pagar')
  const { user } = useSession()
  const nav = useNavigate()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await storage.getLists()
      setLists(data as ShoppingList[])
    } catch (e) {
      console.error('Erro ao carregar listas para contas:', e)
    } finally {
      setLoading(false)
    }
  }

  function computeReal(list: ShoppingList): number {
    return list.items.reduce((sum, item) => sum + (item.checked ? item.price * item.quantity : 0), 0)
  }

  function getParticipantsCount(list: ShoppingList): number {
    const base = Array.isArray(list.memberNames) ? list.memberNames.length : (list.memberCount || 0)
    const includeOwner = list.includeOwnerInSplit ? 1 : 0
    const total = base + includeOwner
    return Math.max(total, 0)
  }

  function isShared(list: ShoppingList): boolean {
    const participants = getParticipantsCount(list)
    return (list.type === 'shared') || participants > 1
  }

  const { toPay, toReceive, totals } = useMemo(() => {
    const entriesToPay: AccountEntry[] = []
    const entriesToReceive: AccountEntry[] = []

    for (const list of lists) {
      // Só considera como "conta" se splitEnabled estiver ativo explicitamente
      if (!list.splitEnabled) continue

      const real = computeReal(list)
      if (real <= 0) continue

      const participants = getParticipantsCount(list)
      const perPerson = real / Math.max(participants, 1)

      if (list.userId === user?.id) {
        // Dono recebe dos demais participantes (inclui o dono se configurado)
        const othersCount = Math.max(participants - (list.includeOwnerInSplit ? 1 : 0), 0)
        const amountToReceive = perPerson * othersCount
        if (amountToReceive > 0) {
          entriesToReceive.push({ listId: list.id, listName: list.name, amount: amountToReceive, participants, perPerson })
        }
      } else {
        // Usuário participa de lista de outra pessoa?
        const isMember = Array.isArray(list.memberNames)
          ? list.memberNames.some(n => n.toLowerCase().includes((user?.name||'').toLowerCase()))
          : true // se não houver nomes, assume que participa

        if (isMember) {
          const byMember = list.charges?.byMember || []
          const myName = (user?.name||'').toLowerCase().trim()
          const me = byMember.find((m:any) => m.name.toLowerCase().trim() === myName) || byMember.find((m:any) => m.name.toLowerCase().includes(myName))
          const isPaid = me?.status === 'pago'
          entriesToPay.push({ listId: list.id, listName: list.name, amount: perPerson, participants, perPerson, isPaid })
        }
      }
    }

    const totalToPay = entriesToPay.reduce((s, e) => s + e.amount, 0)
    const totalToReceive = entriesToReceive.reduce((s, e) => s + e.amount, 0)

    return { toPay: entriesToPay, toReceive: entriesToReceive, totals: { totalToPay, totalToReceive } }
  }, [lists, user])

  return (
    <div className="pt-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
        <p className="text-gray-600 text-sm mt-1">Acompanhe o que você tem a pagar e a receber das listas</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`p-3 rounded-xl border-2 transition-all ${activeTab === 'pagar' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('pagar')}
        >
          A pagar {totals.totalToPay > 0 ? `• R$ ${totals.totalToPay.toFixed(2)}` : ''}
        </button>
        <button
          className={`p-3 rounded-xl border-2 transition-all ${activeTab === 'receber' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('receber')}
        >
          A receber {totals.totalToReceive > 0 ? `• R$ ${totals.totalToReceive.toFixed(2)}` : ''}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'pagar' && (
            <div className="space-y-3">
              {toPay.length === 0 ? (
                <div className="card text-center text-gray-600">Nenhuma conta a pagar</div>
              ) : (
                toPay.map(entry => (
                  <button key={entry.listId} className={`card flex items-center justify-between w-full text-left hover:bg-gray-50 ${entry.isPaid ? 'opacity-60 line-through' : ''}`} onClick={()=>nav(`/contas/${entry.listId}/pagar`)}>
                    <div>
                      <div className="font-semibold text-gray-900">{entry.listName}</div>
                      <div className="text-xs text-gray-500">Participantes: {entry.participants}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">R$ {entry.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Você deve</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'receber' && (
            <div className="space-y-3">
              {toReceive.length === 0 ? (
                <div className="card text-center text-gray-600">Nenhuma conta a receber</div>
              ) : (
                toReceive.map(entry => (
                  <button key={entry.listId} className="card flex items-center justify-between w-full text-left hover:bg-gray-50" onClick={()=>nav(`/contas/${entry.listId}`)}>
                    <div>
                      <div className="font-semibold text-gray-900">{entry.listName}</div>
                      <div className="text-xs text-gray-500">Participantes: {entry.participants}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">R$ {entry.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Você vai receber</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

