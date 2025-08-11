import { useEffect, useState } from 'react'
import { Plus, Minus, Users, Split, X, Check } from 'lucide-react'
import { Modal, useResponsiveModalSizing } from './Modal'
import { storage, type Item as StorageItem, type Category as StorageCategory } from '../lib/storage'
import { QuickContactModal } from './QuickContactModal'

interface NewListModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateList: (listData: any) => void
}

type ListType = 'personal' | 'shared'

export function NewListModal({ isOpen, onClose, onCreateList }: NewListModalProps) {
  const { padding } = useResponsiveModalSizing()
  const [formData, setFormData] = useState({
    name: '', description: '', type: 'personal' as ListType, memberCount: 2, memberNames: ['', ''], initialItems: [] as string[]
  })
  const [showItemSelector, setShowItemSelector] = useState(false)
  const [allItems, setAllItems] = useState<StorageItem[]>([])
  const [allCategories, setAllCategories] = useState<StorageCategory[]>([])
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([])
  const [createContactOpen, setCreateContactOpen] = useState(false)
  const [prefillName, setPrefillName] = useState('')
  const [prefillPhone, setPrefillPhone] = useState('')
  const [openSuggestIndex, setOpenSuggestIndex] = useState<number|null>(null)
  const [creatingIndex, setCreatingIndex] = useState<number|null>(null)

  useEffect(()=>{ (async()=>{
    const [items, cats] = await Promise.all([storage.getItems(), storage.getCategories()])
    const cons = await storage.getContacts()
    setAllItems(items); setAllCategories(cats); setContacts(cons)
  })() }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    const listData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      memberCount: formData.type === 'shared' ? formData.memberCount : 1,
      memberNames: formData.type === 'shared' ? formData.memberNames.filter(n=>n.trim()) : [],
      memberPhones: formData.type === 'shared' ? formData.memberNames.map(v=>v.replace(/\D/g,'')).filter(Boolean) : [],
      initialItems: formData.initialItems
    }
    onCreateList(listData)
    handleClose()
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', type: 'personal', memberCount: 2, memberNames: ['', ''], initialItems: [] })
    setShowItemSelector(false)
    onClose()
  }

  const updateMemberCount = (count:number)=>{
    const newCount = Math.max(2, Math.min(8, count))
    const newNames = [...formData.memberNames]
    if (newCount > newNames.length) { for (let i=newNames.length;i<newCount;i++) newNames.push('') }
    else newNames.splice(newCount)
    setFormData(prev=>({ ...prev, memberCount:newCount, memberNames:newNames }))
  }

  const updateMemberName = (index:number, name:string)=>{
    const newNames = [...formData.memberNames]; newNames[index]=name; setFormData(prev=>({...prev, memberNames:newNames })); setOpenSuggestIndex(name.trim()?index:null)
  }

  function suggestionsFor(index:number){
    const q = (formData.memberNames[index]||'').trim().toLowerCase(); if (!q) return [] as {id:string;name:string;phone:string}[]
    return contacts.filter(c=> c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)).slice(0,5)
  }

  function openCreateContactFor(index:number){
    const value = formData.memberNames[index]||''; const only = value.replace(/\D/g,''); const isPhone = only.length>=8
    setPrefillName(isPhone?'' : value); setPrefillPhone(isPhone? value : ''); setCreateContactOpen(true); setCreatingIndex(index)
  }

  const groupedItems = allItems.reduce((acc, item)=>{ const cat = allCategories.find(c=>c.id===item.categoryId); const name = cat?.name||'Sem categoria'; (acc[name] ||= []).push(item); return acc }, {} as Record<string, StorageItem[]>)

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Lista">
      <div className="flex flex-col" style={{ height:'100%' }}>
        <div className={`flex-1 ${padding==='p-2'?'p-2':'p-3'} modal-scroll`} style={{ minHeight:0 }}>
          <form id="new-list-form" onSubmit={handleSubmit} className={`${padding==='p-2'?'space-y-2':'space-y-3'}`}>
            <div className="card space-y-2">
              <div>
                <label className={`block font-medium text-gray-700 ${padding==='p-2'?'text-xs mb-1':'text-sm mb-1.5'}`}>Nome da Lista *</label>
                <input type="text" className="input" placeholder="Ex: Compras da Semana" value={formData.name} onChange={(e)=>setFormData(prev=>({...prev,name:e.target.value}))} required />
              </div>
              <div>
                <label className={`block font-medium text-gray-700 ${padding==='p-2'?'text-xs mb-1':'text-sm mb-1.5'}`}>Descrição (opcional)</label>
                <input type="text" className="input" placeholder="Ex: Lista principal para compras do supermercado" value={formData.description} onChange={(e)=>setFormData(prev=>({...prev,description:e.target.value}))} />
              </div>
            </div>
            <div className="card">
              <label className={`block font-medium text-gray-700 ${padding==='p-2'?'text-xs mb-1':'text-sm mb-2'}`}>Tipo de Lista</label>
              <div className={`grid grid-cols-2 ${padding==='p-2'?'gap-1.5':'gap-2'}`}>
                <button type="button" className={`${padding==='p-2'?'p-2':'p-2.5'} rounded-lg border-2 transition-all duration-200 ${formData.type==='personal'?'border-green-500 bg-green-50 text-green-700':'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`} onClick={()=>setFormData(prev=>({...prev,type:'personal'}))}>
                  <Users size={padding==='p-2'?16:18} className="mx-auto mb-1" />
                  <div className={`font-medium ${padding==='p-2'?'text-xs':'text-sm'}`}>Pessoal</div>
                  <div className={`text-gray-500 ${padding==='p-2'?'text-xs':'text-xs'}`}>Só para mim</div>
                </button>
                <button type="button" className={`${padding==='p-2'?'p-2':'p-2.5'} rounded-lg border-2 transition-all duration-200 ${formData.type==='shared'?'border-green-500 bg-green-50 text-green-700':'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`} onClick={()=>setFormData(prev=>({...prev,type:'shared'}))}>
                  <Split size={padding==='p-2'?16:18} className="mx-auto mb-1" />
                  <div className={`font-medium ${padding==='p-2'?'text-xs':'text-sm'}`}>Compartilhada</div>
                  <div className={`text-gray-500 ${padding==='p-2'?'text-xs':'text-xs'}`}>Com outras pessoas</div>
                </button>
              </div>
            </div>
            {formData.type==='shared' && (
              <div className="card space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Pessoas</label>
                  <div className="flex items-center gap-3">
                    <button type="button" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95" onClick={()=>updateMemberCount(formData.memberCount-1)} disabled={formData.memberCount<=2}><Minus size={14}/></button>
                    <span className="w-12 text-center font-semibold text-lg">{formData.memberCount}</span>
                    <button type="button" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95" onClick={()=>updateMemberCount(formData.memberCount+1)} disabled={formData.memberCount>=8}><Plus size={14}/></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomes/telefones dos membros</label>
                  <div className="space-y-2">
                    {formData.memberNames.map((name, index)=>{
                      const sugg = suggestionsFor(index)
                      return (
                        <div key={index} className="relative">
                          <input type="text" className="input" placeholder={`Pessoa ${index+1} (nome ou telefone)`} value={name} onChange={(e)=>updateMemberName(index, e.target.value)} onFocus={()=> setOpenSuggestIndex(index)} />
                          {openSuggestIndex===index && sugg.length>0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow">
                              {sugg.map(s => (
                                <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between" onClick={()=>{ const newNames=[...formData.memberNames]; newNames[index]=s.phone||s.name; setFormData(prev=>({...prev, memberNames:newNames})); setOpenSuggestIndex(null) }}>
                                  <span className="text-sm text-gray-800">{s.name}</span>
                                  <span className="text-xs text-gray-500">{s.phone}</span>
                                </button>
                              ))}
                              <button type="button" className="w-full text-left px-3 py-2 text-xs text-green-700 hover:bg-green-50" onClick={()=>{ openCreateContactFor(index); setOpenSuggestIndex(null) }}>+ Criar novo contato</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Itens Iniciais (opcional)</label>
                <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium" onClick={()=>setShowItemSelector(!showItemSelector)}>{showItemSelector?'Fechar':'Adicionar Itens'}</button>
              </div>
              {showItemSelector && (
                <div className="border border-gray-200 rounded-2xl p-4 max-h-60 overflow-y-auto">
                  {Object.entries(groupedItems).map(([categoryName, items])=> (
                    <div key={categoryName} className="mb-4 last:mb-0">
                      <div className="font-medium text-sm text-gray-700 mb-2">{categoryName}</div>
                      <div className="space-y-1">
                        {items.map(item => (
                          <label key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-green-600 rounded focus:ring-green-500" checked={formData.initialItems.includes(item.id)} onChange={()=>setFormData(prev=>({ ...prev, initialItems: prev.initialItems.includes(item.id)? prev.initialItems.filter(i=>i!==item.id): [...prev.initialItems, item.id] }))} />
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
        <div className={`border-t border-gray-100 ${padding==='p-2'?'p-2':'p-3'}`} style={{ flexShrink:0 }}>
          <div className="flex gap-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1"><X size={16} className="mr-2" />Cancelar</button>
            <button type="submit" form="new-list-form" className="btn flex-1" disabled={!formData.name.trim()}><Check size={16} className="mr-2" />Criar Lista</button>
          </div>
        </div>
      </div>
    </Modal>
    <QuickContactModal isOpen={createContactOpen} onClose={()=>setCreateContactOpen(false)} initialName={prefillName} initialPhone={prefillPhone} onSave={async({name, phone})=>{ await storage.createContact({ name, phone }); setContacts(await storage.getContacts()); let target = creatingIndex ?? formData.memberNames.findIndex(n=>!n.trim()); if (target===-1) target=0; const newNames=[...formData.memberNames]; newNames[target]=phone||name; setFormData(prev=>({...prev, memberNames:newNames})); setCreatingIndex(null) }} />
    </>
  )
}

