import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Package, ChevronDown, X, Search, Scale, Hash } from 'lucide-react'
import { storage, type Item as StorageItem, type Category as StorageCategory } from '../lib/storage'
import { QuantityStepper } from './QuantityStepper'
import { NewCategoryModal } from './NewCategoryModal'

interface AddItemFormProps {
  onAddItem: (item: { itemId?: string; name: string; categoryId?: string; price?: number; qty?: number; unit?: string }) => void
  isExpanded: boolean
  onToggleExpanded: () => void
  startInCreateMode?: boolean
  hideCollapsedButton?: boolean
  createOnly?: boolean
  compact?: boolean
  itemsCount?: number
}

export function AddItemForm({ onAddItem, isExpanded, onToggleExpanded, startInCreateMode = false, hideCollapsedButton = false, createOnly = false, compact = false, itemsCount = 0 }: AddItemFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null)
  const [allItems, setAllItems] = useState<StorageItem[]>([])
  const [allCategories, setAllCategories] = useState<StorageCategory[]>([])
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    qty: '1',
    unit: 'unidade' // 'unidade' ou 'peso'
  })
  const [itemQuantityData, setItemQuantityData] = useState({
    qty: '1',
    unit: 'unidade'
  })
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)

  useEffect(() => {
    Promise.all([storage.getItems(), storage.getCategories()]).then(([items, cats]) => {
      setAllItems(items)
      setAllCategories(cats)
    })
  }, [])

  // Normalização acento-insensível
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Filtrar itens existentes baseado na busca (acento-insensível)
  const filteredItems = allItems.filter(item =>
    normalize(item.name).includes(normalize(searchQuery))
  )

  // Mostrar formulário de criação somente quando forçado explicitamente
  const shouldShowCreateForm = createOnly ? true : showCreateForm
  
  // Mostrar seleção de quantidade se um item foi selecionado
  const shouldShowQuantitySelection = createOnly ? false : (selectedItem !== null)

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryDropdown])

  // Quando abrir expandido com startInCreateMode, ir direto ao formulário de criação
  useEffect(() => {
    if (isExpanded && startInCreateMode) {
      setShowCreateForm(true)
      setSelectedItem(null)
    }
  }, [isExpanded, startInCreateMode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onAddItem({
      name: formData.name.trim(),
      price: formData.price ? parseFloat(formData.price) : undefined,
      categoryId: formData.category || undefined,
      qty: formData.unit === 'peso' ? parseFloat(formData.qty) || 1 : parseInt(formData.qty) || 1,
      unit: formData.unit
    })

    resetForm()
  }

  const handleSelectExistingItem = (item: StorageItem) => {
    setSelectedItem(item)
    // Reset quantity data quando selecionar novo item
    setItemQuantityData({
      qty: '1',
      unit: 'unidade'
    })
  }

  const handleConfirmItemWithQuantity = () => {
    if (!selectedItem) return
    
    const category = allCategories.find(c => c.id === selectedItem.categoryId)
    const quantity = itemQuantityData.unit === 'peso' ? parseFloat(itemQuantityData.qty) || 1 : parseInt(itemQuantityData.qty) || 1
    
    // Calcular preço baseado na quantidade (se o item tiver preço)
    const itemPrice = selectedItem.price ? selectedItem.price * quantity : undefined
    
    onAddItem({
      itemId: selectedItem.id,
      name: selectedItem.name,
      categoryId: category?.id,
      qty: quantity,
      unit: itemQuantityData.unit,
      price: itemPrice
    })
    resetForm()
  }

  const resetForm = () => {
    setSearchQuery('')
    setShowCreateForm(false)
    setSelectedItem(null)
    setFormData({
      name: '',
      price: '',
      category: '',
      qty: '1',
      unit: 'unidade'
    })
    setItemQuantityData({
      qty: '1',
      unit: 'unidade'
    })
    if (!createOnly) {
      onToggleExpanded()
    }
  }

  const handleCreateNew = () => {
    setShowCreateForm(true)
    setFormData(prev => ({ ...prev, name: searchQuery }))
  }

  const handleQuickAdd = () => {
    const q = searchQuery.trim()
    if (!q) return
    // tentar achar melhor correspondência
    const exact = allItems.find(i => normalize(i.name) === normalize(q))
    const starts = allItems.find(i => normalize(i.name).startsWith(normalize(q)))
    const first = filteredItems[0]
    const chosen = exact || starts || first
    if (chosen) {
      handleSelectExistingItem(chosen)
      return
    }
    // se não houver correspondência, abrir criação já com o nome preenchido
    handleCreateNew()
  }

  const getCategoryColor = (categoryId: string) => {
    const category = allCategories.find(c => c.id === categoryId)
    return category?.color || '#gray'
  }

  const getCategoryName = (categoryId: string) => {
    const category = allCategories.find(c => c.id === categoryId)
    return category?.name || 'Categoria'
  }

  const handleCreateCategory = async (data: { name: string; color: string }) => {
    const created = await storage.createCategory({ name: data.name, color: data.color })
    setAllCategories(prev => [...prev, created])
    setFormData(prev => ({ ...prev, category: created.id }))
    setShowCategoryDropdown(false)
  }

  const expanded = compact ? true : isExpanded

  if (!expanded) {
    if (hideCollapsedButton) return null
    return (
      <button
        onClick={onToggleExpanded}
        className="btn w-full flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Adicionar Item
      </button>
    )
  }

  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200'}`}>
      {compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Itens ({itemsCount})</h3>
        </div>
      )}
      {/* Seleção de Quantidade para Item Existente */}
      {shouldShowQuantitySelection && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Package size={20} className="text-green-600" />
            <h3 className="font-medium text-gray-900">Definir Quantidade</h3>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const category = allCategories.find(c => c.id === selectedItem?.categoryId)
                return category ? (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                ) : null
              })()}
              <div className="flex-1">
                <div className="font-medium text-gray-900">{selectedItem?.name}</div>
                <div className="text-xs text-gray-500">
                  {(() => {
                    const category = allCategories.find(c => c.id === selectedItem?.categoryId)
                    return category?.name || 'Sem categoria'
                  })()}
                </div>
                {selectedItem?.price && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    R$ {selectedItem.price.toFixed(2)} por {itemQuantityData.unit === 'peso' ? 'kg' : 'unidade'}
                  </div>
                )}
              </div>
            </div>

            {/* Tipo de Quantidade */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Quantidade
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setItemQuantityData(prev => ({ ...prev, unit: 'unidade', qty: '1' }))}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    itemQuantityData.unit === 'unidade'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Hash size={18} className="mx-auto mb-1" />
                  <div className="font-medium text-sm">Unidade</div>
                  <div className="text-xs text-gray-500">1, 2, 3...</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setItemQuantityData(prev => ({ ...prev, unit: 'peso', qty: '1' }))}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                    itemQuantityData.unit === 'peso'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Scale size={18} className="mx-auto mb-1" />
                  <div className="font-medium text-sm">Peso</div>
                  <div className="text-xs text-gray-500">kg, g</div>
                </button>
              </div>

              {/* Campo de Quantidade */}
              <QuantityStepper
                value={itemQuantityData.qty}
                unit={itemQuantityData.unit as 'unidade'|'peso'}
                onChange={(v) => setItemQuantityData(prev => ({ ...prev, qty: v }))}
              />
              
              {itemQuantityData.unit === 'peso' && (
                <div className="text-xs text-gray-500 mt-1">
                  Use decimais para gramas: 0.5 kg = 500g
                </div>
              )}
            </div>

            {/* Resumo do Preço */}
            {selectedItem?.price && (
              <div className="bg-green-50 p-3 rounded-xl border border-green-200 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-700">Preço Total</div>
                  <div className="font-bold text-lg text-green-700">
                    R$ {(selectedItem.price * (parseFloat(itemQuantityData.qty) || 1)).toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {itemQuantityData.qty} {itemQuantityData.unit === 'peso' ? 'kg' : 'unidades'} × R$ {selectedItem.price.toFixed(2)}
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-secondary flex-1"
              >
                <X size={16} className="mr-2" />
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmItemWithQuantity}
                className="btn flex-1"
              >
                <Plus size={16} className="mr-2" />
                Adicionar à Lista
              </button>
            </div>
          </div>
        </>
      )}

      {/* Busca de Itens Existentes - priorizada */}
      {!createOnly && !shouldShowCreateForm && !shouldShowQuantitySelection && (
        <>
          {!compact && (
            <div className="flex items-center gap-2 mb-3">
              <Search size={20} className="text-blue-600" />
              <h3 className="font-medium text-gray-900">Buscar Item Existente</h3>
            </div>
          )}

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do item..."
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              autoFocus
              onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd() } }}
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shadow hover:bg-green-700 active:scale-95"
                title="Adicionar rapidamente"
                aria-label="Adicionar item"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {/* Resultados da Busca */}
          {searchQuery.length > 0 && filteredItems.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white">
              {filteredItems.map((item) => {
                const category = allCategories.find(c => c.id === item.categoryId)
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectExistingItem(item)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
                  >
                    {category && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{category?.name || 'Sem categoria'}</div>
                      {item.price && (
                        <div className="text-xs text-green-600 font-medium mt-0.5">
                          R$ {item.price.toFixed(2)} por kg/un
                        </div>
                      )}
                    </div>
                    <Plus size={16} className="text-green-600" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Removido rodapé de texto/ação; o botão "+" já cria se não houver resultados */}

          {!compact && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-gray-700 hover:text-green-700"
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={16} />
                  <span className="font-medium">Criar item personalizado</span>
                </div>
              </button>
            </div>
          )}

          {/* Botão de cancelar */}
          {!compact && (
            <div className="pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary w-full"
              >
                <X size={16} className="mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </>
      )}

      {/* Formulário de Criação */}
      {shouldShowCreateForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-green-600" />
              <h3 className="font-medium text-gray-900">Criar Novo Item</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (createOnly) {
                  onToggleExpanded()
                } else {
                  setShowCreateForm(false)
                  setFormData(prev => ({ ...prev, name: '' }))
                }
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

      {/* Nome do Item */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Item *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Banana, Leite, Detergente..."
          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
          required
        />
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-xl bg-white hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              {formData.category ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getCategoryColor(formData.category) }}
                  />
                  <span className="text-gray-900">{getCategoryName(formData.category)}</span>
                </>
              ) : (
                <span className="text-gray-500">Selecionar categoria...</span>
              )}
            </div>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} 
            />
          </button>

              {showCategoryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              <button
                type="button"
                className="w-full text-left p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-100 text-green-700"
                onClick={() => {
                  setIsNewCategoryOpen(true)
                }}
              >
                <Plus size={16} />
                <span>Criar nova categoria</span>
              </button>
              <div
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => {
                  setFormData(prev => ({ ...prev, category: '' }))
                  setShowCategoryDropdown(false)
                }}
              >
                <span className="text-gray-500">Sem categoria</span>
              </div>
                  {allCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 last:border-b-0 border-b border-gray-100"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, category: category.id }))
                    setShowCategoryDropdown(false)
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-gray-900">{category.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tipo de Quantidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Quantidade
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, unit: 'unidade', qty: '1' }))}
            className={`p-3 rounded-xl border-2 transition-all duration-200 ${
              formData.unit === 'unidade'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Hash size={18} className="mx-auto mb-1" />
            <div className="font-medium text-sm">Unidade</div>
            <div className="text-xs text-gray-500">1, 2, 3...</div>
          </button>
          
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, unit: 'peso', qty: '1' }))}
            className={`p-3 rounded-xl border-2 transition-all duration-200 ${
              formData.unit === 'peso'
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Scale size={18} className="mx-auto mb-1" />
            <div className="font-medium text-sm">Peso</div>
            <div className="text-xs text-gray-500">kg, g</div>
          </button>
        </div>

        {/* Campo de Quantidade */}
        <QuantityStepper
          value={formData.qty}
          unit={formData.unit as 'unidade'|'peso'}
          onChange={(v) => setFormData(prev => ({ ...prev, qty: v }))}
        />
        
        {formData.unit === 'peso' && (
          <div className="text-xs text-gray-500 mt-1">
            Use decimais para gramas: 0.5 kg = 500g
          </div>
        )}
      </div>

      {/* Preço por unidade/peso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {formData.unit === 'peso' ? 'Preço por kg (opcional)' : 'Preço por unidade (opcional)'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
            R$
          </span>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder={formData.unit === 'peso' ? 'Preço do kg' : 'Preço da unidade'}
            step="0.01"
            min="0"
            className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
          />
        </div>
        {formData.price && (
          <div className="bg-green-50 p-3 rounded-xl border border-green-200 mt-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-700">Preço Total</div>
              <div className="font-bold text-lg text-green-700">
                {(() => {
                  const unitPrice = parseFloat(formData.price) || 0
                  const quantity = formData.unit === 'peso' ? (parseFloat(formData.qty) || 1) : (parseInt(formData.qty) || 1)
                  return `R$ ${(unitPrice * quantity).toFixed(2)}`
                })()}
              </div>
            </div>
            <div className="text-xs text-green-600 mt-1">
              {formData.qty} {formData.unit === 'peso' ? 'kg' : 'unidades'} × R$ {parseFloat(formData.price||'0').toFixed(2)}
            </div>
          </div>
        )}
      </div>

          {/* Botões do formulário de criação */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary flex-1"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim()}
              className="btn flex-1"
            >
              <Plus size={16} className="mr-2" />
              Criar Item
            </button>
          </div>
        </form>
      )}
      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => setIsNewCategoryOpen(false)}
        onCreate={handleCreateCategory}
        existingNames={allCategories.map(c => c.name)}
      />
    </div>
  )
}