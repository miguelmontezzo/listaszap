
import { useEffect, useState } from 'react'
import { mockApi } from '../../lib/mockData'

type Category = { id: string; name: string; color: string }

export function CategoriesPage(){
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    loadCategories()
  },[])

  async function loadCategories() {
    try {
      const data = await mockApi.getCategories()
      setCats(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-4 space-y-3">
      <button className="btn w-full">+ Nova categoria</button>
      
      {loading ? (
        <div className="text-center py-8 text-neutral-500">
          Carregando categorias...
        </div>
      ) : cats.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          Nenhuma categoria encontrada
        </div>
      ) : (
        <div className="card divide-y divide-neutral-100">
          {cats.map(c => (
            <div key={c.id} className="py-3 flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: c.color }}
              />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
