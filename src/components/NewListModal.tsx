import { useState } from 'react'
import { Plus, Minus, Users, Split, X } from 'lucide-react'
import { Modal } from './Modal'
import { mockItems, mockCategories } from '../lib/mockData'

interface NewListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateList: (listData: any) => void
}

type ListType = 'personal' | 'shared'

export function NewListModal({ isOpen, onClose, onCreateList }: NewListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'personal' as ListType,
    memberCount: 2,
    memberNames: ['', ''],
    initialItems: [] as string[]
  })

  const [showItemSelector, setShowItemSelector] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) return

    const listData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      memberCount: formData.type === 'shared' ? formData.memberCount : 1,
      memberNames: formData.type === 'shared' ? formData.memberNames.filter(name => name.trim()) : [],
      initialItems: formData.initialItems
    }

    onCreateList(listData)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      type: 'personal',
      memberCount: 2,
      memberNames: ['', ''],
      initialItems: []
    })
    setShowItemSelector(false)
    onClose()
  }

  const updateMemberCount = (count: number) => {
    const newCount = Math.max(2, Math.min(8, count))
    const newNames = [...formData.memberNames]
    
    if (newCount > newNames.length) {
      // Adicionar campos vazios
      for (let i = newNames.length; i < newCount; i++) {
        newNames.push('')
      }
    } else {
      // Remover campos extras
      newNames.splice(newCount)
    }
    
    setFormData(prev => ({
      ...prev,
      memberCount: newCount,
      memberNames: newNames
    }))
  }

  const updateMemberName = (index: number, name: string) => {
    const newNames = [...formData.memberNames]
    newNames[index] = name
    setFormData(prev => ({ ...prev, memberNames: newNames }))
  }

  const toggleItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      initialItems: prev.initialItems.includes(itemId)
        ? prev.initialItems.filter(id => id !== itemId)
        : [...prev.initialItems, itemId]
    }))
  }

  const groupedItems = mockItems.reduce((acc, item) => {
    const category = mockCategories.find(cat => cat.id === item.categoryId)
    const categoryName = category?.name || 'Sem categoria'
    
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(item)
    return acc
  }, {} as Record<string, typeof mockItems>)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Lista">
      <div className="flex flex-col" style={{ height: '100%' }}>
        <div className="flex-1 p-4 sm:p-6 modal-scroll" style={{ minHeight: 0 }}>
          <form id="new-list-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Nome da Lista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Lista *
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Compras da Semana"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição (opcional)
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Lista principal para compras do supermercado"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Tipo de Lista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Lista
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                formData.type === 'personal'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                type: 'personal'
              }))}
            >
              <Users size={20} className="mx-auto mb-1" />
              <div className="font-medium text-sm">Pessoal</div>
              <div className="text-xs text-gray-500">Só para mim</div>
            </button>
            
            <button
              type="button"
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                formData.type === 'shared'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                type: 'shared'
              }))}
            >
              <Split size={20} className="mx-auto mb-1" />
              <div className="font-medium text-sm">Compartilhada</div>
              <div className="text-xs text-gray-500">Com outras pessoas</div>
            </button>
          </div>
        </div>

        {/* Configurações para Lista Compartilhada */}
        {formData.type === 'shared' && (
          <div className="space-y-3">
            {/* Número de Pessoas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pessoas
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200 active:scale-95"
                  onClick={() => updateMemberCount(formData.memberCount - 1)}
                  disabled={formData.memberCount <= 2}
                >
                  <Minus size={16} />
                </button>
                
                <span className="w-12 text-center font-semibold text-lg">
                  {formData.memberCount}
                </span>
                
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200 active:scale-95"
                  onClick={() => updateMemberCount(formData.memberCount + 1)}
                  disabled={formData.memberCount >= 8}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Nomes dos Membros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomes dos Membros (opcional)
              </label>
              <div className="space-y-2">
                {formData.memberNames.map((name, index) => (
                  <input
                    key={index}
                    type="text"
                    className="input"
                    placeholder={`Pessoa ${index + 1}`}
                    value={name}
                    onChange={(e) => updateMemberName(index, e.target.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Adicionar Itens Iniciais */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Itens Iniciais (opcional)
            </label>
            <button
              type="button"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
              onClick={() => setShowItemSelector(!showItemSelector)}
            >
              {showItemSelector ? 'Fechar' : 'Adicionar Itens'}
            </button>
          </div>
          
          {formData.initialItems.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">
                {formData.initialItems.length} item(s) selecionado(s)
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.initialItems.map(itemId => {
                  const item = mockItems.find(i => i.id === itemId)
                  return (
                    <span
                      key={itemId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {item?.name}
                      <button
                        type="button"
                        onClick={() => toggleItem(itemId)}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {showItemSelector && (
            <div className="border border-gray-200 rounded-2xl p-4 max-h-60 overflow-y-auto">
              {Object.entries(groupedItems).map(([categoryName, items]) => (
                <div key={categoryName} className="mb-4 last:mb-0">
                  <div className="font-medium text-sm text-gray-700 mb-2">
                    {categoryName}
                  </div>
                  <div className="space-y-1">
                    {items.map(item => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          checked={formData.initialItems.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </form>
        </div>
        
        {/* Botões Fixos */}
        <div className="border-t border-gray-100 p-4" style={{ flexShrink: 0 }}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="new-list-form"
              className="btn flex-1"
              disabled={!formData.name.trim()}
            >
              Criar Lista
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}