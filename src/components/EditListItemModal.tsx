import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { QuantityStepper } from './QuantityStepper'

interface EditListItemModalProps {
  isOpen: boolean
  onClose: () => void
  initial: { id: string; name: string; quantity: number; price: number; unit?: 'unidade'|'peso' } | null
  onSave: (patch: { listItemId: string; quantity: number; price: number; unit?: 'unidade'|'peso' }) => void | Promise<void>
  onDelete: (listItemId: string) => void | Promise<void>
}

export function EditListItemModal({ isOpen, onClose, initial, onSave, onDelete }: EditListItemModalProps) {
  const [qty, setQty] = useState<string>('1')
  const [price, setPrice] = useState<string>('')
  const [unit, setUnit] = useState<'unidade'|'peso'>('unidade')

  useEffect(() => {
    if (!isOpen || !initial) return
    setQty(String(initial.quantity ?? 1))
    if (initial.price != null) {
      const num = Number(initial.price)
      setPrice(num.toFixed(2).replace('.', ','))
    } else {
      setPrice('')
    }
    setUnit(initial.unit || 'unidade')
  }, [isOpen, initial])

  if (!initial) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ listItemId: initial.id, quantity: unit==='peso' ? parseFloat(qty)||1 : parseInt(qty)||1, price: price ? parseFloat(price.replace(',', '.')) : 0, unit })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar ${initial.name}`} autoHeight>
      <form onSubmit={submit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Quantidade</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button type="button" onClick={() => { setUnit('unidade'); setQty('1') }} className={`p-3 rounded-xl border-2 ${unit==='unidade'?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-200'}`}>Unidade</button>
            <button type="button" onClick={() => { setUnit('peso'); setQty('1') }} className={`p-3 rounded-xl border-2 ${unit==='peso'?'border-orange-500 bg-orange-50 text-orange-700':'border-gray-200'}`}>Peso</button>
          </div>
          <QuantityStepper value={qty} unit={unit} onChange={setQty} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
          <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
            <span className="pl-3 pr-2 text-gray-500 text-sm">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(e)=>{
                const digits = e.target.value.replace(/\D/g, '')
                if (!digits) { setPrice(''); return }
                const number = (parseInt(digits, 10) / 100).toFixed(2)
                setPrice(number.replace('.', ','))
              }}
              className="flex-1 py-3 pr-3 bg-transparent outline-none border-0"
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-danger flex-1" onClick={async ()=>{ await onDelete(initial.id); onClose() }}>Excluir</button>
          <button type="submit" className="btn flex-1">Salvar</button>
        </div>
      </form>
    </Modal>
  )
}

