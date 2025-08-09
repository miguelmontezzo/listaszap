import { useState, useEffect, useRef } from 'react'
import { Plus, Package, ChevronDown } from 'lucide-react'
import { mockCategories } from '../lib/mockData'

interface AddItemFormProps {
  onAddItem: (item: { name: string; price?: number; category?: string; qty?: number }) => void
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function AddItemForm({ onAddItem, isExpanded, onToggleExpanded }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    qty: '1'
  })
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    onAddItem({
      name: formData.name.trim(),
      price: formData.price ? parseFloat(formData.price) : undefined,
      category: formData.category || undefined,
      qty: parseInt(formData.qty) || 1
    })

    // Resetar form
    setFormData({
      name: '',
      price: '',
      category: '',
      qty: '1'
    })
    onToggleExpanded()
  }

  const getCategoryColor = (categoryId: string) => {
    const category = mockCategories.find(c => c.id === categoryId)
    return category?.color || '#gray'
  }

  const getCategoryName = (categoryId: string) => {
    const category = mockCategories.find(c => c.id === categoryId)
    return category?.name || 'Categoria'
  }

  if (!isExpanded) {
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Package size={20} className="text-green-600" />
        <h3 className="font-medium text-gray-900">Novo Item</h3>
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
              <div
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => {
                  setFormData(prev => ({ ...prev, category: '' }))
                  setShowCategoryDropdown(false)
                }}
              >
                <span className="text-gray-500">Sem categoria</span>
              </div>
              {mockCategories.map((category) => (
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

      {/* Quantidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade
        </label>
        <input
          type="number"
          value={formData.qty}
          onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
          min="1"
          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
          placeholder="1"
        />
      </div>

      {/* Preço */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preço Estimado (opcional)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
            R$
          </span>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0,00"
            step="0.01"
            min="0"
            className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!formData.name.trim()}
          className="btn flex-1"
        >
          Adicionar
        </button>
      </div>
    </form>
  )
}