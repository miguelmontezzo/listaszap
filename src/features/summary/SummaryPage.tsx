import { useEffect, useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { storage, type ShoppingList, type Item as StorageItem, type Category as StorageCategory } from '../../lib/storage'

type RangeKey = '7d' | '30d' | '90d' | '365d' | 'all'
type GroupKey = 'day' | 'month' | 'year'

type MetricPoint = { label: string; value: number }

function formatCurrency(n: number): string {
  return `R$ ${n.toFixed(2)}`
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfYear(d: Date): Date {
  const x = new Date(d.getFullYear(), 0, 1)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatGroupLabel(d: Date, group: GroupKey): string {
  const dd = new Date(d)
  if (group === 'day') return dd.toLocaleDateString()
  if (group === 'month') return `${String(dd.getMonth() + 1).padStart(2, '0')}/${dd.getFullYear()}`
  return String(dd.getFullYear())
}

export function SummaryPage() {
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [itemsById, setItemsById] = useState<Map<string, StorageItem>>(new Map())
  const [categoriesById, setCategoriesById] = useState<Map<string, StorageCategory>>(new Map())
  const [allItems, setAllItems] = useState<StorageItem[]>([])
  const [allCategories, setAllCategories] = useState<StorageCategory[]>([])
  const [range, setRange] = useState<RangeKey>('all')
  const [groupBy, setGroupBy] = useState<GroupKey>('month')
  const [metricMode, setMetricMode] = useState<'valor'|'quantidade'>('valor')

  useEffect(() => {
    ;(async () => {
      try {
        const ls = await storage.getLists()
        const allItemIds = Array.from(new Set(ls.flatMap(l => (l.items || []).map(it => it.itemId).filter(Boolean))))
        let referencedItems: StorageItem[] = []
        const sAny = storage as any
        if (typeof sAny.getItemsByIds === 'function') {
          referencedItems = await sAny.getItemsByIds(allItemIds)
        } else {
          referencedItems = await storage.getItems()
        }
        const catIds = Array.from(new Set(referencedItems.map(i => i.categoryId).filter(Boolean)))
        let referencedCats: StorageCategory[] = []
        if (typeof sAny.getCategoriesByIds === 'function') {
          referencedCats = await sAny.getCategoriesByIds(catIds)
        } else {
          referencedCats = await storage.getCategories()
        }
        setLists(ls)
        setItemsById(new Map(referencedItems.map(i => [i.id, i])))
        setCategoriesById(new Map(referencedCats.map(c => [c.id, c])))
        // cargas completas para contagens totais por usuário
        const [itemsFull, categoriesFull] = await Promise.all([
          storage.getItems(),
          storage.getCategories(),
        ])
        setAllItems(itemsFull)
        setAllCategories(categoriesFull)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const now = new Date()
  const rangeStart = useMemo(() => {
    if (range === 'all') return new Date(0)
    const d = new Date(now)
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    d.setDate(d.getDate() - days)
    d.setHours(0, 0, 0, 0)
    return d
  }, [range])

  const listsInRange = useMemo(() => {
    return lists.filter(l => {
      const created = new Date(l.createdAt)
      return created >= rangeStart
    })
  }, [lists, rangeStart])

  const perListTotals = useMemo(() => {
    return listsInRange.map(l => {
      const sum = (l.items || [])
        .filter(li => !!li.checked)
        .reduce((acc, li) => acc + (li.price || 0) * (li.quantity || 1), 0)
      return { id: l.id, createdAt: new Date(l.createdAt), total: sum }
    })
  }, [listsInRange])

  const totalSpent = useMemo(() => perListTotals.reduce((s, x) => s + x.total, 0), [perListTotals])
  const purchaseCount = useMemo(() => perListTotals.filter(x => x.total > 0).length, [perListTotals])
  const avgPerPurchase = useMemo(() => (purchaseCount > 0 ? totalSpent / purchaseCount : 0), [totalSpent, purchaseCount])
  const avgFrequencyDays = useMemo(() => {
    const dates = perListTotals.filter(x => x.total > 0).map(x => startOfDay(x.createdAt)).sort((a, b) => a.getTime() - b.getTime())
    if (dates.length < 2) return 0
    let sum = 0
    for (let i = 1; i < dates.length; i++) {
      const diffMs = dates[i].getTime() - dates[i - 1].getTime()
      sum += Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
    }
    return sum / (dates.length - 1)
  }, [perListTotals])

  const byCategory = useMemo(() => {
    const acc = new Map<string, { name: string; value: number; qty: number }>()
    for (const l of listsInRange) {
      for (const li of l.items || []) {
        if (!li.checked) continue
        const item = itemsById.get(li.itemId)
        const cat = item?.categoryId ? categoriesById.get(item.categoryId) : undefined
        const key = cat?.id || 'sem-categoria'
        const name = cat?.name || 'Sem categoria'
        const val = (li.price || 0) * (li.quantity || 1)
        const q = li.quantity || 1
        const prev = acc.get(key)
        acc.set(key, { name, value: (prev?.value || 0) + val, qty: (prev?.qty || 0) + q })
      }
    }
    for (const c of allCategories) {
      if (!acc.has(c.id)) acc.set(c.id, { name: c.name, value: 0, qty: 0 })
    }
    const arr = Array.from(acc.values())
    arr.sort((a, b) => {
      const av = metricMode === 'valor' ? a.value : a.qty
      const bv = metricMode === 'valor' ? b.value : b.qty
      return bv - av
    })
    return arr
  }, [listsInRange, itemsById, categoriesById, allCategories, metricMode])

  const byItem = useMemo(() => {
    const acc = new Map<string, { name: string; value: number; qty: number }>()
    for (const l of listsInRange) {
      for (const li of l.items || []) {
        if (!li.checked) continue
        const item = itemsById.get(li.itemId)
        const name = item?.name || 'Item'
        const val = (li.price || 0) * (li.quantity || 1)
        const q = li.quantity || 1
        const prev = acc.get(li.itemId)
        acc.set(li.itemId, { name, value: (prev?.value || 0) + val, qty: (prev?.qty || 0) + q })
      }
    }
    const arr = Array.from(acc.values())
    arr.sort((a, b) => {
      const av = metricMode === 'valor' ? a.value : a.qty
      const bv = metricMode === 'valor' ? b.value : b.qty
      return bv - av
    })
    return arr
  }, [listsInRange, itemsById, metricMode])

  const mostSpentCategory = (() => {
    const positive = byCategory.find(c => c.value > 0)
    return positive ? positive.name : '-'
  })()

  const groupedSeries: MetricPoint[] = useMemo(() => {
    const buckets = new Map<string, number>()
    for (const p of perListTotals) {
      if (p.total <= 0) continue
      let keyDate: Date
      if (groupBy === 'day') keyDate = startOfDay(p.createdAt)
      else if (groupBy === 'month') keyDate = startOfMonth(p.createdAt)
      else keyDate = startOfYear(p.createdAt)
      const key = keyDate.toISOString()
      buckets.set(key, (buckets.get(key) || 0) + p.total)
    }
    const entries = Array.from(buckets.entries()).map(([k, v]) => ({ label: formatGroupLabel(new Date(k), groupBy), value: v }))
    entries.sort((a, b) => {
      const pa = a.label.split('/').reverse().join('-')
      const pb = b.label.split('/').reverse().join('-')
      return pa < pb ? -1 : pa > pb ? 1 : 0
    })
    return entries
  }, [perListTotals, groupBy])

  const totalCategories = useMemo(() => allCategories.length, [allCategories])
  const totalItems = useMemo(() => allItems.length, [allItems])

  if (loading) {
    return (
      <div className="pt-4">
        <div className="text-center py-8 text-neutral-500">Carregando resumo...</div>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-gray-700" />
            <h1 className="text-lg font-bold text-gray-900">Resumo</h1>
          </div>
          <div className="flex gap-2">
            <select value={range} onChange={e => setRange(e.target.value as RangeKey)} className="input">
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="90d">90 dias</option>
              <option value="365d">12 meses</option>
              <option value="all">Tudo</option>
            </select>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupKey)} className="input">
              <option value="day">Dia</option>
              <option value="month">Mês</option>
              <option value="year">Ano</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-500">Total gasto</div>
          <div className="text-2xl font-extrabold text-green-600">{formatCurrency(totalSpent)}</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-gray-500">Média por compra</div>
              <div className="text-base font-semibold text-gray-900">{formatCurrency(avgPerPurchase)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-500">Frequência média</div>
              <div className="text-base font-semibold text-gray-900">{avgFrequencyDays ? `${avgFrequencyDays.toFixed(1)} dias` : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="text-xs text-gray-500">Compras no período</div>
          <div className="text-xl font-bold text-gray-900">{purchaseCount}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500">Categoria mais gasta</div>
          <div className="text-sm font-semibold text-gray-900">{mostSpentCategory}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500">Categorias criadas</div>
          <div className="text-xl font-bold text-gray-900">{totalCategories}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500">Itens criados</div>
          <div className="text-xl font-bold text-gray-900">{totalItems}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">Gasto por {groupBy === 'day' ? 'dia' : groupBy === 'month' ? 'mês' : 'ano'}</div>
          <div className="text-xs text-gray-500">{groupedSeries.length} pontos</div>
        </div>
        {groupedSeries.length === 0 ? (
          <div className="text-center text-gray-500 py-6">Sem dados no período</div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const max = Math.max(...groupedSeries.map(p => p.value)) || 1
              return groupedSeries.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-20 text-[11px] text-gray-500">{p.label}</div>
                  <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                    <div className="h-3 bg-green-500" style={{ width: `${Math.max(2, Math.round((p.value / max) * 100))}%` }} />
                  </div>
                  <div className="w-20 text-right text-[11px] text-gray-600">{formatCurrency(p.value)}</div>
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">Top categorias</div>
          <div className="rounded-lg bg-gray-100 p-0.5">
            <div className="flex">
              <button className={`px-3 py-1 text-xs rounded-md ${metricMode==='valor' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`} onClick={()=>setMetricMode('valor')}>Valor</button>
              <button className={`px-3 py-1 text-xs rounded-md ${metricMode==='quantidade' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`} onClick={()=>setMetricMode('quantidade')}>Qtd</button>
            </div>
          </div>
        </div>
        {byCategory.length === 0 ? (
          <div className="text-center text-gray-500 py-6">Sem dados</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto -mx-2 px-2 pb-1">
            {(() => {
              const data = byCategory
              const max = Math.max(...data.map(d => (metricMode==='valor'? d.value : d.qty))) || 1
              return data.map((c, idx) => {
                const v = metricMode==='valor' ? c.value : c.qty
                return (
                  <div key={idx} className="min-w-[180px] shrink-0 border border-gray-100 rounded-xl p-3">
                    <div className="text-[12px] text-gray-700 truncate">{c.name}</div>
                    <div className="mt-2 bg-gray-100 rounded h-2 overflow-hidden">
                      <div className="h-2 bg-emerald-500" style={{ width: `${Math.max(2, Math.round((v / max) * 100))}%` }} />
                    </div>
                    <div className="mt-1 text-right text-[11px] text-gray-600">{metricMode==='valor' ? formatCurrency(c.value) : `${c.qty}`}</div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">Top itens</div>
          <div className="rounded-lg bg-gray-100 p-0.5">
            <div className="flex">
              <button className={`px-3 py-1 text-xs rounded-md ${metricMode==='valor' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`} onClick={()=>setMetricMode('valor')}>Valor</button>
              <button className={`px-3 py-1 text-xs rounded-md ${metricMode==='quantidade' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`} onClick={()=>setMetricMode('quantidade')}>Qtd</button>
            </div>
          </div>
        </div>
        {byItem.length === 0 ? (
          <div className="text-center text-gray-500 py-6">Sem dados</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto -mx-2 px-2 pb-1">
            {(() => {
              const data = byItem
              const max = Math.max(...data.map(d => (metricMode==='valor'? d.value : d.qty))) || 1
              return data.map((c, idx) => {
                const v = metricMode==='valor' ? c.value : c.qty
                return (
                  <div key={idx} className="min-w-[180px] shrink-0 border border-gray-100 rounded-xl p-3">
                    <div className="text-[12px] text-gray-700 truncate">{c.name}</div>
                    <div className="mt-2 bg-gray-100 rounded h-2 overflow-hidden">
                      <div className="h-2 bg-sky-500" style={{ width: `${Math.max(2, Math.round((v / max) * 100))}%` }} />
                    </div>
                    <div className="mt-1 text-right text-[11px] text-gray-600">{metricMode==='valor' ? formatCurrency(c.value) : `${c.qty}`}</div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

