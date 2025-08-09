import { useState } from 'react'
import { Plus, X } from 'lucide-react'

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
  const [isAdding, setIsAdding] = useState(false)

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim())
      setNewMemberName('')
      setIsAdding(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Membros da Lista</h3>
        <span className="text-sm text-gray-500">{members.length} pessoa(s)</span>
      </div>

      {/* Lista de Membros */}
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 group"
          >
            {/* Avatar */}
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(member.name)}
            </div>
            
            {/* Nome */}
            <span className="text-sm font-medium text-green-700">
              {member.name}
            </span>
            
            {/* Botão Remover */}
            <button
              onClick={() => onRemoveMember(member.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-green-200 rounded-full p-0.5"
            >
              <X size={12} className="text-green-600" />
            </button>
          </div>
        ))}

        {/* Botão Adicionar */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-full text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors text-sm"
          >
            <Plus size={14} />
            Adicionar
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-3 py-1">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMember()
                if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewMemberName('')
                }
              }}
              placeholder="Nome da pessoa"
              className="text-sm border-none outline-none bg-transparent flex-1 min-w-0"
              autoFocus
            />
            <button
              onClick={handleAddMember}
              disabled={!newMemberName.trim()}
              className="text-green-600 hover:text-green-700 disabled:text-gray-400"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewMemberName('')
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}