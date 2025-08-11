
import { useEffect, useState } from 'react'
import { storage } from '../../lib/storage'
import { NewCategoryModal } from '../../components/NewCategoryModal'
import { EditCategoryModal } from '../../components/EditCategoryModal'
import { useToast } from '../../components/Toast'

type Category = { id: string; name: string; color: string }

export function CategoriesPage(){
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const { show } = useToast()
  const [editing, setEditing] = useState<Category | null>(null)

  useEffect(()=>{
    loadCategories()
  },[])

  async function loadCategories() {
    try {
      const data = await storage.getCategories()
      setCats(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCategory(data: { name: string; color: string }) {
    try {
      await storage.createCategory(data)
      await loadCategories()
      setShowNew(false)
      show('Categoria criada!')
    } catch (e) {
      alert('Erro ao criar categoria')
    }
  }

  async function handleUpdateCategory(id: string, patch: { name?: string; color?: string }) {
    try {
      await storage.updateCategory(id, patch)
      await loadCategories()
      show('Categoria atualizada')
    } catch (e) {
      alert('Erro ao atualizar categoria')
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      if (confirm('Excluir esta categoria?')) {
        await storage.deleteCategory(id)
        await loadCategories()
        show('Categoria excluída')
      }
    } catch (e) {
      alert('Erro ao excluir categoria')
    }
  }

  return (
    <div className="pt-4 space-y-3">
      {/* Header "estilo meta" */}
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">Categorias</div>
          <div className="text-xs text-gray-500">Organize seus itens por grupos</div>
        </div>
        <button className="btn" onClick={() => setShowNew(true)}>+ Nova</button>
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-neutral-500">
          Carregando categorias...
        </div>
      ) : cats.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          Nenhuma categoria encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map(c => (
            <button
              key={c.id}
              className="w-full text-left card flex items-center justify-between hover:bg-gray-50"
              onClick={() => setEditing(c)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.color }} />
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">Toque para editar</div>
                </div>
              </div>
              <span className="text-xs text-gray-400">Editar</span>
            </button>
          ))}
        </div>
      )}
      <NewCategoryModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onCreate={handleCreateCategory}
        existingNames={cats.map(c => c.name)}
      />
      <EditCategoryModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        initial={editing}
        existingNames={cats.map(c => c.name)}
        onSave={async (data) => {
          await storage.updateCategory(data.id, { name: data.name, color: data.color })
          await loadCategories()
          show('Categoria atualizada')
        }}
        onDelete={async (id) => {
          if (confirm('Excluir esta categoria?')) {
            await storage.deleteCategory(id)
            await loadCategories()
            show('Categoria excluída')
          }
        }}
      />
    </div>
  )
}
