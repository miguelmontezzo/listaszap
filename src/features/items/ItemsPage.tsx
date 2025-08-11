
import { useEffect, useMemo, useState } from 'react'
import { SearchInput } from '../../components/SearchInput'
import { storage, type Item as StorageItem, type Category as StorageCategory } from '../../lib/storage'
import { AddItemForm } from '../../components/AddItemForm'
import { EditItemModal } from '../../components/EditItemModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { ChevronDown, PenLine } from 'lucide-react'
import { EditCategoryModal } from '../../components/EditCategoryModal'

type Item = {
  id: string
  name: string
  category?: string
  categoryId: string
  price?: number
  defaultUnit?: 'unidade' | 'peso'
  defaultQty?: number
}

export function ItemsPage(){
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const { show } = useToast()
  const [editing, setEditing] = useState<{ id: string; name: string; categoryId: string; price?: number; defaultUnit?: 'unidade'|'peso'; defaultQty?: number } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string }>({ open: false })
  const [categories, setCategories] = useState<StorageCategory[]>([])
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null)

  useEffect(()=>{
    loadItems()
  },[])

  async function loadItems() {
    try {
      const [data, cats] = await Promise.all([
        storage.getItems(),
        storage.getCategories()
      ])
      setCategories(cats)
      const categoryById = new Map(cats.map(c => [c.id, c.name]))
      const itemsWithCategory: Item[] = (data as StorageItem[]).map(item => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        category: categoryById.get(item.categoryId),
        price: item.price,
        defaultUnit: item.defaultUnit,
        defaultQty: item.defaultQty
      }))
      setItems(itemsWithCategory)
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))

  const grouped = useMemo(() => {
    return items.reduce((acc, i) => {
      const catName = i.category || 'Sem categoria'
      if (!acc[catName]) acc[catName] = []
      acc[catName].push(i)
      return acc
    }, {} as Record<string, Item[]>)
  }, [items])

  const colorByCategoryName = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach(c => map.set(c.name, c.color))
    return map
  }, [categories])

  function toggleCat(name: string) {
    setOpenCats(prev => ({ ...prev, [name]: !prev[name] }))
  }

  function openEditCategoryByName(catName: string) {
    const cat = categories.find(c => c.name === catName)
    if (cat) setEditingCategory({ id: cat.id, name: cat.name, color: cat.color })
  }

  async function handleUpdateName(id: string, newName: string, oldName: string) {
    const name = newName.trim()
    if (!name || name === oldName) return
    try {
      await storage.updateItem(id, { name })
      await loadItems()
      show('Item atualizado')
    } catch (e) {
      alert('Erro ao atualizar item')
    }
  }

  async function handleUpdateCategory(id: string, categoryId: string) {
    try {
      await storage.updateItem(id, { categoryId })
      await loadItems()
      show('Categoria atualizada')
    } catch (e) {
      alert('Erro ao atualizar categoria do item')
    }
  }

  async function handleDelete(id: string) {
    try {
      if (confirm('Excluir este item?')) {
        await storage.deleteItem(id)
        await loadItems()
        show('Item excluído')
      }
    } catch (e) {
      alert('Erro ao excluir item')
    }
  }

  return (
    <div className="pt-4 space-y-3">
      <div className="card space-y-3">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar item" />
        <AddItemForm
          onAddItem={async (data) => {
            // Se usuário selecionou item existente, não duplicar
            if (data.itemId) {
              // já existe no catálogo; apenas informa e fecha
              alert('Este item já existe no catálogo.')
              setShowAddItem(false)
              return
            }
            await storage.createItem({
              name: data.name,
              categoryId: data.categoryId || '',
              price: data.price,
              defaultUnit: (data.unit as 'unidade'|'peso') || 'unidade',
              defaultQty: typeof data.qty === 'number' ? data.qty : 1,
            })
            await loadItems()
            setShowAddItem(false)
            setQ('')
            show('Item criado com sucesso!')
          }}
          isExpanded={showAddItem}
          onToggleExpanded={() => setShowAddItem((v) => !v)}
          startInCreateMode
          createOnly
          hideCollapsedButton
        />
        {!showAddItem && (
          <button className="btn w-full" onClick={() => setShowAddItem(true)}>+ Adicionar novo item</button>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-neutral-500">
          Carregando itens...
        </div>
      ) : q ? (
        filtered.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          {q ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
        </div>
        ) : (
          <div className="card divide-y divide-neutral-100">
            {filtered.map(i => (
              <button
                key={i.id}
                className="w-full text-left py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg"
                onClick={() => setEditing({ id: i.id, name: i.name, categoryId: i.categoryId, price: i.price, defaultUnit: i.defaultUnit, defaultQty: i.defaultQty })}
              >
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-neutral-500">{i.category || 'Sem categoria'}</div>
                </div>
                {typeof i.price === 'number' ? (
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">R$ {i.price.toFixed(2).replace('.', ',')}</div>
                    <div className="text-xs text-gray-400">padrão</div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Editar</span>
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        // visão agrupada por categoria (sem busca)
        Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8 text-neutral-500">Nenhum item cadastrado</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([catName, list]) => {
              const open = !!openCats[catName]
              const color = colorByCategoryName.get(catName)
              return (
                <div key={catName} className="card">
                  <div className="w-full flex items-center justify-between">
                    <button type="button" className="flex items-center gap-3" onClick={() => toggleCat(catName)}>
                      {color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
                      <span className="font-semibold text-gray-900">{catName}</span>
                      <span className="text-xs text-gray-500">{list.length}</span>
                      <ChevronDown size={16} className={`ml-1 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      className="text-green-700 hover:text-green-800 text-sm inline-flex items-center gap-1"
                      onClick={() => openEditCategoryByName(catName)}
                    >
                      <PenLine size={14} /> Editar categoria
                    </button>
                  </div>
                  {open && (
                    <div className="divide-y divide-neutral-100 mt-3">
                      {list.map(i => (
                        <button
                          key={i.id}
                          className="w-full text-left py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg"
                          onClick={() => setEditing({ id: i.id, name: i.name, categoryId: i.categoryId, price: i.price, defaultUnit: i.defaultUnit, defaultQty: i.defaultQty })}
                        >
                          <div>
                            <div className="font-medium">{i.name}</div>
                            <div className="text-xs text-neutral-500">{i.category || 'Sem categoria'}</div>
                          </div>
                          {typeof i.price === 'number' ? (
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">R$ {i.price.toFixed(2).replace('.', ',')}</div>
                              <div className="text-xs text-gray-400">padrão</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Editar</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        initial={editingCategory}
        existingNames={categories.map(c => c.name)}
        onSave={async ({ id, name, color }) => {
          await storage.updateCategory(id, { name, color })
          await loadItems()
        }}
        onDelete={async (id: string) => {
          await storage.deleteCategory(id)
          await loadItems()
        }}
      />
      <EditItemModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        item={editing}
        onSave={async (patch: any) => {
          await storage.updateItem(patch.id, { name: patch.name, categoryId: patch.categoryId, price: patch.price, defaultUnit: patch.defaultUnit, defaultQty: patch.defaultQty })
          await loadItems()
          show('Item atualizado')
        }}
        onDelete={async (id) => {
          setConfirmDelete({ open: true, id })
        }}
      />
      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Excluir item"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete({ open: false })}
        onConfirm={async () => {
          if (confirmDelete.id) {
            await storage.deleteItem(confirmDelete.id)
            await loadItems()
            show('Item excluído')
          }
          setConfirmDelete({ open: false })
        }}
      />
    </div>
  )
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    storage.getCategories().then((cs) => setOptions(cs.map(c => ({ id: c.id, name: c.name }))))
  }, [])

  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Sem categoria</option>
      {options.map(o => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  )
}
