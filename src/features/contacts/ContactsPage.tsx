import { useEffect, useMemo, useState } from 'react'
import { storage } from '../../lib/storage'
import { Plus, Phone, User, X } from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'

type Contact = { id: string; name: string; phone: string }

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string }>({ open: false })

  useEffect(() => { load() }, [])

  async function load() {
    const list = await storage.getContacts()
    setContacts(list)
    setLoading(false)
  }

  async function add() {
    const n = name.trim()
    const p = phone.trim()
    if (!n && !p) return
    const payload = { name: n || 'Sem nome', phone: p || 'Sem telefone' }
    await storage.createContact(payload)
    setName(''); setPhone('')
    await load()
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="card space-y-3">
        <div>
          <div className="text-base font-semibold text-gray-900">Contatos</div>
          <div className="text-xs text-gray-500">Salve pessoas para facilitar listas compartilhadas</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Telefone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <button className="btn col-span-2" onClick={add}><Plus size={16} className="mr-2"/>Adicionar</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Carregando...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">Nenhum contato salvo</div>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">{c.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.phone}</div>
                </div>
              </div>
              <button className="text-red-600" onClick={()=>setConfirm({ open: true, id: c.id })}><X size={16}/></button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open}
        title="Excluir contato"
        description="Tem certeza que deseja excluir este contato?"
        confirmLabel="Excluir"
        onCancel={()=>setConfirm({ open: false })}
        onConfirm={async ()=>{ if (confirm.id) await storage.deleteContact(confirm.id); setConfirm({ open: false }); await load() }}
      />
    </div>
  )
}

