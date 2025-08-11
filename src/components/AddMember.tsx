import { useEffect, useMemo, useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { storage } from '../lib/storage'
import { QuickContactModal } from './QuickContactModal'

interface Member {
  id: string
  name: string
}

interface AddMemberProps {
  members: Member[]
  onAddMember: (name: string) => void
  onRemoveMember: (id: string) => void
}

export function AddMember({ members, onAddMember, onRemoveMember }: AddMemberProps) {
  const [newMemberName, setNewMemberName] = useState('')
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([])
  const [showCreate, setShowCreate] = useState(false)

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
      onAddMember(match.name)
      setNewMemberName('')
      return
    }
    // se não houver contato, abrir modal para completar nome/telefone
    setShowCreate(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Membros ({members.length})</h3>
      </div>

      {/* Layout Horizontal Otimizado: Campo + Avatares */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Campo de Input com ícone */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddMember()
            }}
            placeholder="Nome ou contato"
            className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
          />
          {suggestions.length>0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow">
              {suggestions.map(s => (
                <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between" onClick={()=>{ onAddMember(s.name); setNewMemberName('') }}>
                  <span className="text-sm text-gray-800">{s.name}</span>
                  <span className="text-xs text-gray-500">{s.phone}</span>
                </button>
              ))}
              <button type="button" className="w-full text-left px-3 py-2 text-xs text-green-700 hover:bg-green-50" onClick={()=>setShowCreate(true)}>+ Criar novo contato</button>
            </div>
          )}
          {newMemberName.trim() && (
            <button
              onClick={handleAddMember}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700 transition-colors"
              title="Adicionar membro"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Avatares dos Membros - Layout mais compacto */}
        <div className="flex items-center -space-x-1">
          {members.slice(0, 4).map((member, index) => (
            <div
              key={member.id}
              className="relative group"
            >
              {/* Avatar */}
              <div 
                className={`w-9 h-9 ${getAvatarColor(index)} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg`}
                title={member.name}
              >
                {getInitials(member.name)}
              </div>
              
              {/* Botão de Remover (aparece no hover) */}
              <button
                onClick={() => onRemoveMember(member.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg z-20 hover:bg-red-600"
                title={`Remover ${member.name}`}
              >
                <X size={12} className="text-white" />
              </button>
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
          
          {/* Indicador de adicionar - sempre visível */}
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
        </div>
      </div>

      {/* Lista de nomes para telas pequenas (opcional) */}
      {members.length > 0 && (
        <div className="text-xs text-gray-500 sm:hidden">
          {members.map(member => member.name).join(', ')}
        </div>
      )}
    </div>

    <QuickContactModal
      isOpen={showCreate}
      onClose={()=>setShowCreate(false)}
      initialName={/\D/.test(newMemberName) ? newMemberName : ''}
      initialPhone={!/\D/.test(newMemberName) ? newMemberName : ''}
      onSave={async ({ name, phone }) => {
        await storage.createContact({ name, phone })
        setContacts(await storage.getContacts())
        onAddMember(name)
        setNewMemberName('')
      }}
    />
    </>
  )
}