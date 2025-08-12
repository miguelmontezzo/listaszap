import { useEffect, useMemo, useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { storage } from '../lib/storage'
import { api } from '../lib/api'
import { useSession } from '../lib/session'
import { QuickContactModal } from './QuickContactModal'

interface Member {
  id: string
  name: string
}

interface AddMemberProps {
  members: Member[]
  onAddMember: (name: string) => void
  onRemoveMember: (id: string) => void
  allowRemove?: boolean
  canAdd?: boolean
}

export function AddMember({ members, onAddMember, onRemoveMember, allowRemove = true, canAdd = true }: AddMemberProps) {
  const [newMemberName, setNewMemberName] = useState('')
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [visibleNameId, setVisibleNameId] = useState<string|null>(null)
  const { user } = useSession()

  useEffect(()=>{ storage.getContacts().then(setContacts) }, [])

  const suggestions = useMemo(()=>{
    const q = newMemberName.trim().toLowerCase()
    if (!q) return [] as { id: string; name: string; phone: string }[]
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)).slice(0,5)
  }, [newMemberName, contacts])

  const handleAddMember = async () => {
    const v = newMemberName.trim()
    if (!v) return
    // se casar com contato, usa o nome do contato
    const match = contacts.find(c => c.name.toLowerCase() === v.toLowerCase() || c.phone.replace(/\D/g,'') === v.replace(/\D/g,''))
    if (match) {
      try {
        // webhook: adicionar membro existente
        const listId = (new URL(window.location.href)).pathname.split('/').pop() || ''
        await api.addUserToList({ id_lista: listId, membro_nome: match.name, membro_phone: match.phone, userId: user?.id })
        onAddMember(match.phone || match.name)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Webhook add user failed:', e)
        onAddMember(match.phone || match.name)
      }
      setNewMemberName('')
      return
    }
    // se não houver contato, abrir modal para completar nome/telefone
    setShowCreate(true)
  }

  const getInitials = (raw: string) => {
    // Se vier telefone, tenta resolver para contato salvo
    const onlyDigits = raw.replace(/\D/g, '')
    let display = raw
    if (onlyDigits.length >= 8) {
      const match = contacts.find(c => c.phone.replace(/\D/g,'') === onlyDigits)
      if (match?.name) display = match.name
    }
    return display
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const resolveDisplayName = (raw: string) => {
    const onlyDigits = raw.replace(/\D/g, '')
    if (onlyDigits.length >= 8) {
      const match = contacts.find(c => c.phone.replace(/\D/g,'') === onlyDigits)
      if (match?.name) return match.name
    }
    return raw
  }

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-green-500',
      'bg-blue-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500'
    ]
    return colors[index % colors.length]
  }

  return (
    <>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Membros ({members.length})</h3>
      </div>

      {/* Campo grande + botão "+" destacado + avatares */}
      <div className="flex items-center gap-3">
        {/* Campo com ícone e botão "+" */}
        {canAdd && (
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember() }}
              placeholder="Nome ou contato"
              className="w-full pl-10 pr-12 py-3 text-base border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            {newMemberName.trim() && (
              <button
                onClick={handleAddMember}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center shadow hover:bg-green-700 active:scale-95"
                title="Adicionar membro"
              >
                <Plus size={18} />
              </button>
            )}
            {suggestions.length>0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                    onClick={async ()=>{
                      try {
                        const listId = (new URL(window.location.href)).pathname.split('/').pop() || ''
                        await api.addUserToList({ id_lista: listId, membro_nome: s.name, membro_phone: s.phone, userId: user?.id })
                      } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error('Webhook add user (suggestion) failed:', e)
                      }
                      onAddMember(s.phone || s.name)
                      setNewMemberName('')
                    }}
                  >
                    <span className="text-sm text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-500">{s.phone}</span>
                  </button>
                ))}
                <button type="button" className="w-full text-left px-3 py-2 text-xs text-green-700 hover:bg-green-50" onClick={()=>setShowCreate(true)}>+ Criar novo contato</button>
              </div>
            )}
          </div>
        )}

        {/* Avatares */}
        <div className="flex items-center -space-x-1">
          {members.slice(0, 4).map((member, index) => (
            <div
              key={member.id}
              className="relative group"
            >
              {/* Avatar */}
               <div 
                className={`w-9 h-9 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg`}
                title={resolveDisplayName(member.name)}
                onClick={()=>{ setVisibleNameId(member.id); window.setTimeout(()=>setVisibleNameId(null), 1200) }}
              >
                {getInitials(member.name)}
              </div>

              {/* Tooltip com nome ao hover/click */}
              <div
                className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full px-2 py-1 rounded bg-gray-800 text-white text-[10px] shadow transition-opacity duration-150 ${visibleNameId===member.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {resolveDisplayName(member.name)}
              </div>
              
              {/* Botão de Remover (aparece no hover) */}
              {allowRemove && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg z-20 hover:bg-red-600"
                  title={`Remover ${member.name}`}
                >
                  <X size={12} className="text-white" />
                </button>
              )}
            </div>
          ))}
          
          {/* Indicador de membros extras */}
          {members.length > 4 && (
            <div className="w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white"
              title={`+${members.length - 4} membros`}
            >
              +{members.length - 4}
            </div>
          )}
          
          {/* Indicador de adicionar - apenas quando permitido */}
          {canAdd && (
            <div 
              className="w-9 h-9 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors cursor-pointer ml-1"
              onClick={() => {
                const input = document.querySelector('input[placeholder*="Nome ou contato"]') as HTMLInputElement
                input?.focus()
              }}
              title="Adicionar membro"
            >
              <Plus size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Lista de nomes para telas pequenas (opcional) */}
      {members.length > 0 && (
        <div className="text-xs text-gray-500 sm:hidden">
          {members.map(member => member.name).join(', ')}
        </div>
      )}
    </div>

    {canAdd && (
      <QuickContactModal
        isOpen={showCreate}
        onClose={()=>setShowCreate(false)}
        initialName={/\D/.test(newMemberName) ? newMemberName : ''}
        initialPhone={!/\D/.test(newMemberName) ? newMemberName : ''}
        onSave={async ({ name, phone }) => {
          await storage.createContact({ name, phone })
          setContacts(await storage.getContacts())
          try {
            const listId = (new URL(window.location.href)).pathname.split('/').pop() || ''
            await api.addUserToList({ id_lista: listId, membro_nome: name, membro_phone: phone, userId: user?.id })
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Webhook add user (new contact) failed:', e)
          }
          onAddMember(phone || name)
          setNewMemberName('')
        }}
      />
    )}
    </>
  )
}