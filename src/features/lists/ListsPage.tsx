
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import { ListCard } from '../../components/ListCard'
import { NewListModal } from '../../components/NewListModal'
import { storage } from '../../lib/storage'
import { useSession } from '../../lib/session'

type L = { id: string; name: string; progress: number; total: number; real: number }

export function ListsPage(){
  const [lists, setLists] = useState<L[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const nav = useNavigate()
  const { user } = useSession()

  useEffect(()=>{
    loadLists()
  },[])

  async function loadLists() {
    try {
      const data = await storage.getLists()
      // Calcular estatísticas das listas
      const listsWithStats = data.map(list => {
        const checkedItems = list.items.filter(item => item.checked).length
        const totalItems = list.items.length
        const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0
        const totalValue = list.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const realValue = list.items
          .filter(item => item.checked)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        return {
          id: list.id,
          name: list.name,
          progress: Math.round(progress),
          total: totalValue,
          real: realValue
        }
      })
      setLists(listsWithStats)
    } catch (error) {
      console.error('Erro ao carregar listas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateList(listData: any) {
    try {
      await storage.createList({ ...listData, userId: user!.id })
      await loadLists() // Recarregar listas
      setShowNewListModal(false)
    } catch (error) {
      console.error('Erro ao criar lista:', error)
      alert('Erro ao criar lista. Tente novamente.')
    }
  }

  return (
    <div className="pt-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suas Listas</h1>
        <p className="text-gray-600 text-sm mt-1">Organize suas compras de forma inteligente</p>
      </div>
      
      <button 
        className="btn w-full text-base py-4" 
        onClick={() => setShowNewListModal(true)}
      >
        ➕ Nova Lista de Compras
      </button>
      
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card loading">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-2 bg-gray-200 rounded mb-3"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <ListChecks size={24} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Nenhuma lista ainda</h3>
          <p className="text-gray-500 text-sm">Crie sua primeira lista para começar a organizar suas compras</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(l => (
            <ListCard key={l.id} name={l.name} progress={l.progress} total={l.total} real={l.real} onClick={()=>nav(`/listas/${l.id}`)} />
          ))}
        </div>
      )}

      <NewListModal
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        onCreateList={handleCreateList}
      />
    </div>
  )
}
