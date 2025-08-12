import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  centered?: boolean
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirmar',
  description = 'Tem certeza desta ação? Esta ação não pode ser desfeita.',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  centered = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} autoHeight centered={centered}>
      <div className="p-4 space-y-5">
        <div className="text-base leading-relaxed text-gray-700">{description}</div>
        <div className="flex gap-3">
          <button
            className="flex-1 h-12 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 active:scale-[0.98] transition"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

