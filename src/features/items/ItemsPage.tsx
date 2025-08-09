
import { useEffect, useState } from 'react'
import { SearchInput } from '../../components/SearchInput'
import { mockApi, mockCategories } from '../../lib/mockData'

type Item = { id: string; name: string; category?: string; categoryId: string }

export function ItemsPage(){
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    loadItems()
  },[])

  async function loadItems() {
    try {
      const data = await mockApi.getItems()
      // Mapear items com nome da categoria
      const itemsWithCategory = data.map(item => ({
        ...item,
        category: mockCategories.find(cat => cat.id === item.categoryId)?.name
      }))
      setItems(itemsWithCategory)
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="pt-4 space-y-3">
      <div className="card space-y-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar item" />
        <button className="btn w-full">+ Novo item</button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-neutral-500">
          Carregando itens...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {q ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
        </div>
      ) : (
        <div className="card divide-y divide-neutral-100">
          {filtered.map(i => (
            <div key={i.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-neutral-500">{i.category || 'Sem categoria'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
