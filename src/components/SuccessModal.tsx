import { Check } from 'lucide-react'
import { Modal } from './Modal'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  confirmLabel?: string
}

export function SuccessModal({ isOpen, onClose, title = 'Tudo certo!', message = 'Dados salvos com sucesso.', confirmLabel = 'OK' }: SuccessModalProps){
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} autoHeight>
      <div className="p-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
          <Check size={24} />
        </div>
        <div className="text-center text-sm text-gray-700">{message}</div>
        <button className="btn w-full" onClick={onClose}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}

