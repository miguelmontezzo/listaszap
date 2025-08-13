import { useEffect, useMemo, useState } from 'react'
import { storage, type Item as StorageItem, type Category as StorageCategory } from '../../lib/storage'
import { AddItemForm } from '../../components/AddItemForm'
import { NewCategoryModal } from '../../components/NewCategoryModal'
import { EditCategoryModal } from '../../components/EditCategoryModal'
import { EditItemModal } from '../../components/EditItemModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/Toast'
import { ChevronDown } from 'lucide-react'
import { SearchInput } from '../../components/SearchInput'

type Item = StorageItem & { categoryName?: string }

export function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<StorageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [editingCat, setEditingCat] = useState<StorageCategory | null>(null)
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string }>({ open: false })
  const { show } = useToast()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [its, cats] = await Promise.all([storage.getItems(), storage.getCategories()])
      const catById = new Map(cats.map(c => [c.id, c.name]))
      setItems(its.map(i => ({ ...i, categoryName: catById.get(i.categoryId) })))
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]/g, '') // remove símbolos

  const filteredItems = useMemo(() => {
    const qn = normalize(search.trim())
    if (!qn) return items
    return items.filter(i =>
      normalize(i.name).includes(qn) || normalize(i.categoryName || '').includes(qn)
    )
  }, [items, search])

  const groups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color?: string; items: Item[] }>()
    // Build groups from categories first for stable order
    for (const c of categories) {
      map.set(c.id, { id: c.id, name: c.name, color: c.color, items: [] })
    }
    // No category group
    map.set('no-cat', { id: 'no-cat', name: 'Sem categoria', color: undefined, items: [] })
    for (const it of filteredItems) {
      const key = it.categoryId || 'no-cat'
      if (!map.has(key)) map.set(key, { id: key, name: it.categoryName || 'Sem categoria', items: [] })
      map.get(key)!.items.push(it)
    }
    const arr = Array.from(map.values())
    return search
      ? arr.filter(g => g.items.length > 0)
      : arr.filter(g => g.items.length > 0 || g.id !== 'no-cat')
  }, [filteredItems, categories, search])

  // Ao buscar, expandir automaticamente os grupos com resultados
  useEffect(() => {
    if (search) {
      const next: Record<string, boolean> = {}
      for (const g of groups) next[g.id] = true
      setOpenGroups(prev => ({ ...prev, ...next }))
    }
  }, [search, groups])

  function toggleGroup(id: string) {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Header compacto com ações lado a lado */}
      <div className="card space-y-3">
        <div>
          <div className="text-base font-semibold text-gray-900">Catálogo</div>
          <div className="text-xs text-gray-500">Crie categorias e organize seus itens</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar item ou categoria..." />
          </div>
          {search && (
            <button
              className="px-3 py-2 text-sm rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              onClick={() => setSearch('')}
            >
              Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow hover:from-blue-600 hover:to-blue-700 transition-all"
            onClick={() => setShowNewCat(true)}
          >
            + Nova Categoria
          </button>
          <button
            className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 shadow hover:from-green-600 hover:to-green-700 transition-all"
            onClick={() => setShowAddItem(true)}
          >
            + Novo Item
          </button>
        </div>
      </div>

      {/* Criar item */}
      {showAddItem && (
        <div className="card space-y-3">
          <AddItemForm
            onAddItem={async (data) => {
              if (data.itemId) {
                show('Este item já existe no catálogo')
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
              await loadAll()
              setShowAddItem(false)
              show('Item criado com sucesso!')
            }}
            isExpanded={showAddItem}
            onToggleExpanded={() => setShowAddItem(v => !v)}
            startInCreateMode
            createOnly
            hideCollapsedButton
          />
        </div>
      )}

      {/* Listagem por categoria */}
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">{search ? 'Nenhum resultado encontrado' : 'Nenhum item cadastrado'}</div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => {
            const open = !!openGroups[g.id]
            return (
              <div key={g.id} className="card divide-y divide-neutral-100">
                <div className="py-3 px-2 flex items-center justify-between">
                  <button type="button" className="flex items-center gap-2" onClick={() => toggleGroup(g.id)}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color || '#e5e7eb' }} />
                    <div className="text-sm font-semibold text-gray-900">{g.name}</div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {g.id !== 'no-cat' && (
                    <button className="text-xs text-green-600" onClick={() => setEditingCat(categories.find(c => c.id === g.id) || null)}>Editar categoria</button>
                  )}
                </div>
                {open && g.items.map(i => (
                  <button
                    key={i.id}
                    className="w-full text-left py-3 flex items-center justify-between hover:bg-gray-50 px-2"
                    onClick={() => setEditingItem(i)}
                  >
                    <div>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-neutral-500">{g.name}</div>
                    </div>
                    {typeof i.price === 'number' && (
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">R$ {i.price.toFixed(2).replace('.', ',')}</div>
                        <div className="text-xs text-gray-400">padrão</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Modais */}
      <NewCategoryModal isOpen={showNewCat} onClose={() => setShowNewCat(false)} onCreate={async (data) => { await storage.createCategory(data); await loadAll(); setShowNewCat(false); show('Categoria criada!') }} existingNames={categories.map(c=>c.name)} />
      <EditCategoryModal
        isOpen={!!editingCat}
        onClose={() => setEditingCat(null)}
        initial={editingCat}
        existingNames={categories.map(c=>c.name)}
        onSave={async (d)=>{ await storage.updateCategory(d.id, { name: d.name, color: d.color }); await loadAll(); show('Categoria atualizada') }}
        onDelete={async (id)=>{ await storage.deleteCategory(id); await loadAll(); setEditingCat(null); show('Categoria excluída') }}
      />
      <EditItemModal isOpen={!!editingItem} onClose={()=>setEditingItem(null)} item={editingItem} onSave={async (p)=>{ await storage.updateItem(p.id, { name: p.name, categoryId: p.categoryId, price: p.price, defaultUnit: p.defaultUnit, defaultQty: p.defaultQty }); await loadAll(); show('Item atualizado') }} onDelete={async (id)=>{ setConfirmDelete({ open: true, id }) }} />
      <ConfirmDialog isOpen={confirmDelete.open} title="Excluir" description="Tem certeza que deseja excluir? Esta ação não pode ser desfeita." confirmLabel="Excluir" onCancel={()=>setConfirmDelete({ open: false })} onConfirm={async ()=>{ if (confirmDelete.id) { // tenta excluir item, senão categoria
        const id = confirmDelete.id
        const item = items.find(i => i.id === id)
        if (item) { await storage.deleteItem(id) } else { await storage.deleteCategory(id) }
        await loadAll(); show('Excluído'); setConfirmDelete({ open: false }) }} } />
    </div>
  )
}

