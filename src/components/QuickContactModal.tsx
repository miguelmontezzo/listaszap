import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Check, X } from 'lucide-react'

interface QuickContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; phone: string }) => Promise<void> | void
  initialName?: string
  initialPhone?: string
}

export function QuickContactModal({ isOpen, onClose, onSave, initialName = '', initialPhone = '' }: QuickContactModalProps) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)

  useEffect(() => {
    if (!isOpen) return
    setName(initialName)
    setPhone(initialPhone)
  }, [isOpen, initialName, initialPhone])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    await onSave({ name: name.trim(), phone: phone.trim() })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo contato" autoHeight>
      <form onSubmit={submit} className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input className="input" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input className="input" value={phone} onChange={(e)=>setPhone(e.target.value)} required placeholder="(11) 99999-9999" />
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}><X size={16} className="mr-2"/>Cancelar</button>
          <button type="submit" className="btn flex-1"><Check size={16} className="mr-2"/>Salvar</button>
        </div>
      </form>
    </Modal>
  )
}

