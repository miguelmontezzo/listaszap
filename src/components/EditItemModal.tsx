import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { storage, type Category as StorageCategory } from '../lib/storage'
import { QuantityStepper } from './QuantityStepper'
import { Package, ChevronDown } from 'lucide-react'

type EditableItem = { id: string; name: string; categoryId: string; price?: number; defaultUnit?: 'unidade'|'peso'; defaultQty?: number }

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: EditableItem | null
  onSave: (patch: { id: string; name: string; categoryId: string; price?: number; defaultUnit?: 'unidade'|'peso'; defaultQty?: number }) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function EditItemModal({ isOpen, onClose, item, onSave, onDelete }: EditItemModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState<string>('')
  const [categories, setCategories] = useState<StorageCategory[]>([])
  const [unit, setUnit] = useState<'unidade'|'peso'>('unidade')
  const [qty, setQty] = useState<string>('1')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    storage.getCategories().then(cs => setCategories(cs))
  }, [isOpen])

  useEffect(() => {
    if (!item) return
    setName(item.name)
    setCategoryId(item.categoryId || '')
    setPrice(item.price != null ? String(item.price) : '')
    setUnit(item.defaultUnit || 'unidade')
    setQty(item.defaultQty != null ? String(item.defaultQty) : '1')
  }, [item])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }
    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoryDropdown])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    const normalizedPrice = price.replace(',', '.').trim()
    const payload = {
      id: item.id,
      name: name.trim(),
      categoryId,
      price: normalizedPrice ? parseFloat(normalizedPrice) : undefined,
      defaultUnit: unit,
      defaultQty: qty ? (unit === 'peso' ? parseFloat(qty) || 1 : parseInt(qty) || 1) : 1,
    }
    await onSave(payload)
    onClose()
  }

  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Item">
      <form onSubmit={submit} className="flex flex-col h-full">
        <div className="p-4 space-y-4 flex-1 overflow-y-auto modal-scroll pb-24" style={{ minHeight: 0 }}>
        {/* Header estilo AddItemForm */}
        <div className="flex items-center gap-2">
          <Package size={20} className="text-green-600" />
          <h3 className="font-medium text-gray-900">Detalhes do Item</h3>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Item *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Banana, Leite, Detergente..."
            required
          />
        </div>

        {/* Categoria (dropdown custom) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-xl bg-white hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                {categoryId ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categories.find(c => c.id === categoryId)?.color || '#ccc' }}
                    />
                    <span className="text-gray-900">{categories.find(c => c.id === categoryId)?.name}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Selecionar categoria...</span>
                )}
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                <div
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => { setCategoryId(''); setShowCategoryDropdown(false) }}
                >
                  <span className="text-gray-500">Sem categoria</span>
                </div>
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 last:border-b-0 border-b border-gray-100"
                    onClick={() => { setCategoryId(category.id); setShowCategoryDropdown(false) }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="text-gray-900">{category.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tipo de Quantidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Quantidade</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => { setUnit('unidade'); setQty('1') }}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                unit === 'unidade'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Unidade</div>
              <div className="text-xs text-gray-500">1, 2, 3...</div>
            </button>
            <button
              type="button"
              onClick={() => { setUnit('peso'); setQty('1') }}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                unit === 'peso'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Peso</div>
              <div className="text-xs text-gray-500">kg, g</div>
            </button>
          </div>

          {/* Quantidade padrão */}
          <QuantityStepper value={qty} unit={unit} onChange={setQty} />
        </div>

        {/* Preço padrão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preço padrão (opcional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
            />
          </div>
        </div>

        </div>
        <div className="flex gap-2 p-4 border-t border-gray-100 bg-white sticky-safe-bottom">
          {onDelete && (
            <button type="button" className="btn-danger w-1/3" onClick={async () => { await onDelete(item!.id); onClose() }}>Excluir</button>
          )}
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn flex-1" disabled={!name.trim()}>Salvar</button>
        </div>
      </form>
    </Modal>
  )
}

