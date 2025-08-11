import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { storage, type ShoppingList, type Item as CatalogItem } from '../../lib/storage'
import { useSession } from '../../lib/session'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { CheckCircle2 } from 'lucide-react'

export function PayBillPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [list, setList] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { user } = useSession()
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => { (async () => {
    if (!id) return
    const [l, items] = await Promise.all([storage.getList(id), storage.getItems()])
    setList(l)
    setCatalog(items)
    setLoading(false)
  })() }, [id])

  const totals = useMemo(() => {
    if (!list) return { real: 0, perPerson: 0, participants: 0 }
    const real = list.items.filter(i=>i.checked).reduce((s,i)=>s+i.price*i.quantity,0)
    const base = Array.isArray(list.memberNames) ? list.memberNames.length : (list.memberCount||0)
    const participants = base + (list.includeOwnerInSplit ? 1 : 0)
    const perPerson = participants > 0 ? real / participants : 0
    return { real, perPerson, participants }
  }, [list])

  const receiptLines = useMemo(() => {
    if (!list) return [] as { id: string; name: string; qty: number; unit?: string; unitPrice: number; total: number }[]
    const byId = new Map(catalog.map(i => [i.id, i]))
    return list.items
      .filter(li => li.checked)
      .map(li => {
        const info = byId.get(li.itemId)
        const name = info?.name || 'Item'
        const unit = li.unit || info?.defaultUnit
        const unitPrice = li.price || 0
        const total = unitPrice * (li.quantity || 1)
        return { id: li.id, name, qty: li.quantity || 1, unit, unitPrice, total }
      })
  }, [list, catalog])

  function fmt(n: number) { return n.toFixed(2).replace('.', ',') }

  if (loading) return <div className="pt-4 text-center text-neutral-500">Carregando...</div>
  if (!list) return <div className="pt-4 text-center text-neutral-500">Lista não encontrada</div>

  function resolveMyMemberName(): string {
    const my = (user?.name || '').toLowerCase().trim()
    const candidates = list?.memberNames || []
    const exact = candidates.find(n => n.toLowerCase().trim() === my)
    if (exact) return exact
    const contains = candidates.find(n => n.toLowerCase().includes(my))
    if (contains) return contains
    return candidates[0] || (user?.name || 'Você')
  }

  async function markSelfPaid(proofName?: string) {
    const me = resolveMyMemberName()
    const updated = await storage.updateMemberChargeStatus(list!.id, me, 'pago', proofName)
    setList(updated)
    setSuccessOpen(true)
    setTimeout(()=>{ setSuccessOpen(false); nav('/contas') }, 1500)
  }

  function uploadProof() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      await markSelfPaid(file ? file.name : undefined)
    }
    input.click()
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="card">
        <div className="text-lg font-bold">Pagar • {list.name}</div>
        <div className="text-sm text-gray-600">Sua parte: R$ {totals.perPerson.toFixed(2)}</div>
      </div>

      {/* Cupom/Recibo dos itens pagos */}
      <div className="card bg-white">
        <div className="text-sm font-semibold text-gray-800 mb-2">Cupom da conta</div>
        <div className="border border-dashed rounded-xl p-3 bg-gray-50">
          {receiptLines.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-6">Nenhum item pago ainda</div>
          ) : (
            <div className="text-sm">
              <div className="divide-y divide-gray-200">
                {receiptLines.map(line => (
                  <div key={line.id} className="py-2 flex items-start justify-between">
                    <div className="max-w-[65%]">
                      <div className="text-gray-800">{line.name}</div>
                      <div className="text-[11px] text-gray-500">{line.qty} {line.unit === 'peso' ? 'kg' : 'un'} × R$ {fmt(line.unitPrice)}</div>
                    </div>
                    <div className="text-right font-semibold text-gray-900">R$ {fmt(line.total)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-600">Total</div>
                <div className="font-bold text-gray-900">R$ {fmt(totals.real)}</div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                <div>Dividido entre {totals.participants} {totals.participants === 1 ? 'pessoa' : 'pessoas'}</div>
                <div>Sua parte: R$ {fmt(totals.perPerson)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card space-y-2">
        <div className="text-sm text-gray-700">Como deseja confirmar o pagamento?</div>
        <button className="btn w-full" onClick={uploadProof}>Enviar comprovante (imagem/pdf)</button>
        <button className="btn-secondary w-full" onClick={()=>setConfirmOpen(true)}>Confirmar como pago</button>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirmar pagamento"
        description="Tem certeza que deseja confirmar o pagamento desta conta?"
        confirmLabel="Confirmar"
        onCancel={()=>setConfirmOpen(false)}
        onConfirm={async ()=>{ setConfirmOpen(false); await markSelfPaid() }}
      />

      {/* Tela de sucesso estilo PicPay */}
      <Modal isOpen={successOpen} onClose={()=>{}} title="Pagamento realizado" autoHeight>
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          <CheckCircle2 className="text-green-600" size={56} />
          <div className="text-lg font-semibold text-gray-900">Pagamento confirmado</div>
          <div className="text-sm text-gray-600">Obrigado! Registramos seu pagamento.</div>
        </div>
      </Modal>
    </div>
  )
}

