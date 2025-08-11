import { useState } from 'react'
import { Modal } from './Modal'

interface NewCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; color: string }) => void
  existingNames?: string[]
}

export function NewCategoryModal({ isOpen, onClose, onCreate, existingNames = [] }: NewCategoryModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#22c55e')
  const nameInUse = existingNames.map(n => n.toLowerCase().trim()).includes(name.toLowerCase().trim())

  function reset() {
    setName('')
    setColor('#22c55e')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (nameInUse) return
    onCreate({ name: name.trim(), color })
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Categoria" autoHeight>
      <form onSubmit={submit} className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Frutas"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 w-9 h-9 opacity-0 cursor-pointer"
              />
              <div className="w-9 h-9 rounded-full border" style={{ backgroundColor: color }} />
            </div>
            <input
              className="input flex-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 sticky bottom-0 bg-white pb-3">
          <button type="button" onClick={handleClose} className="btn-secondary w-1/2">Cancelar</button>
          <button type="submit" className="btn w-1/2" disabled={!name.trim() || nameInUse}>Criar</button>
        </div>
        {nameInUse && (
          <div className="text-xs text-red-600">Já existe uma categoria com este nome.</div>
        )}
      </form>
    </Modal>
  )
}

