import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { storage, type ShoppingList, type Item as CatalogItem } from '../../lib/storage'

export function ChargeDetailPage() {
  const { id } = useParams()
  const [list, setList] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState<CatalogItem[]>([])

  useEffect(() => { (async () => {
    if (!id) return
    const [l, items] = await Promise.all([storage.getList(id), storage.getItems()])
    setList(l)
    setCatalog(items)
    setLoading(false)
  })() }, [id])

  const totals = useMemo(() => {
    if (!list) return { real: 0, participants: 0, perPerson: 0 }
    const real = list.items.filter(i=>i.checked).reduce((s,i)=>s+i.price*i.quantity,0)
    const base = Array.isArray(list.memberNames) ? list.memberNames.length : (list.memberCount||0)
    const participants = base + (list.includeOwnerInSplit ? 1 : 0)
    const perPerson = participants > 0 ? real / participants : 0
    return { real, participants, perPerson }
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

  const baseMembers = list.memberNames || []
  const withOwner = list.includeOwnerInSplit ? ['Você', ...baseMembers] : baseMembers
  const byMember = list.charges?.byMember || withOwner.map(name => ({ name, status: 'pendente' as const }))

  const count = (s: 'pendente'|'cobrado'|'pago') => byMember.filter(m=>m.status===s).length

  return (
    <div className="pt-4 space-y-4">
      <div className="card">
        <div className="font-bold text-lg">{list.name}</div>
        <div className="text-sm text-gray-500">Total: R$ {totals.real.toFixed(2)}</div>
        <div className="mt-2 flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Pendente: {count('pendente')}</span>
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">Cobrado: {count('cobrado')}</span>
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">Pago: {count('pago')}</span>
        </div>
      </div>

      {/* Cupom/Comprovante da conta */}
      <div className="card bg-white">
        <div className="text-sm font-semibold text-gray-800 mb-2">Comprovante</div>
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
                <div>Por pessoa: R$ {fmt(totals.perPerson)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card divide-y divide-neutral-100">
        {byMember.map(m => (
          <div key={m.name} className="py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">{m.name}</div>
              <div className="text-xs text-gray-500 capitalize">{m.status}</div>
            </div>
            <div className={`px-2 py-1 rounded text-xs ${m.status==='pendente'?'bg-gray-100 text-gray-700':''} ${m.status==='cobrado'?'bg-yellow-100 text-yellow-800':''} ${m.status==='pago'?'bg-green-100 text-green-800':''}`}>{m.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

