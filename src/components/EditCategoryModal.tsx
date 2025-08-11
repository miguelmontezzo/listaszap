import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { ConfirmDialog } from './ConfirmDialog'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  initial: { id: string; name: string; color: string } | null
  onSave: (data: { id: string; name: string; color: string }) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
  existingNames?: string[]
}

export function EditCategoryModal({ isOpen, onClose, initial, onSave, onDelete, existingNames = [] }: EditCategoryModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#22c55e')
  const [confirmOpen, setConfirmOpen] = useState(false)
  

  useEffect(() => {
    if (!isOpen || !initial) return
    setName(initial.name)
    setColor(initial.color)
  }, [isOpen, initial])

  const nameInUse = existingNames
    .filter(n => n.toLowerCase().trim() !== (initial?.name.toLowerCase().trim() || ''))
    .map(n => n.toLowerCase().trim())
    .includes(name.toLowerCase().trim())

  function handleClose() {
    onClose()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!initial) return
    if (nameInUse || !name.trim()) return
    await onSave({ id: initial.id, name: name.trim(), color })
    handleClose()
  }

  if (!initial) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Editar categoria" autoHeight>
        <form onSubmit={submit} className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <input
                type="color"
                value={color}
                onChange={(e)=>setColor(e.target.value)}
                className="absolute inset-0 w-9 h-9 opacity-0 cursor-pointer"
              />
              <div className="w-9 h-9 rounded-full border" style={{ backgroundColor: color }} />
            </div>
            <input className="input flex-1" value={color} onChange={(e)=>setColor(e.target.value)} />
          </div>
        </div>
        {nameInUse && (
          <div className="text-xs text-red-600">Já existe uma categoria com este nome.</div>
        )}
        <div className="flex gap-2 sticky bottom-0 bg-white pb-3">
          {onDelete && (
            <button type="button" className="btn-danger w-1/3" onClick={()=> setConfirmOpen(true)}>Excluir</button>
          )}
          <button type="button" className="btn-secondary flex-1" onClick={handleClose}>Cancelar</button>
          <button type="submit" className="btn flex-1" disabled={!name.trim() || nameInUse}>Salvar</button>
        </div>
        </form>
      </Modal>
      <ConfirmDialog
          isOpen={confirmOpen}
          title="Excluir categoria"
          description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onCancel={()=> setConfirmOpen(false)}
          onConfirm={async ()=>{ await onDelete?.(initial.id); setConfirmOpen(false); onClose() }}
        />
    </>
  )
}

