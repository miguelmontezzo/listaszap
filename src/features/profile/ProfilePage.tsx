
import { useState } from 'react'
import { useSession } from '../../lib/session'
import { storage } from '../../lib/storage'

export function ProfilePage(){
  const { user, clear } = useSession()
  const [name, setName] = useState(user?.name||'')
  const [email, setEmail] = useState('joao.silva@example.com')
  const [city, setCity] = useState('São Paulo - SP')

  return (
    <div className="pt-4 space-y-4">
      <div className="card space-y-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="mt-3 font-bold text-xl">{name}</div>
          <div className="text-sm text-gray-500">{user?.phone}</div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Conta verificada
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="text-sm text-neutral-500">Nome</div>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} />
        <div className="text-sm text-neutral-500">E-mail</div>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="text-sm text-neutral-500">Cidade</div>
        <input className="input" value={city} onChange={e=>setCity(e.target.value)} />
        <button className="btn w-full">Salvar Alterações</button>
      </div>

      <div className="card space-y-3">
        <div className="font-medium">Configurações</div>
        <div className="text-sm text-neutral-600">
          💡 <strong>Modo desenvolvimento:</strong> Todos os dados são simulados para facilitar o desenvolvimento
        </div>
        <button
          className="btn btn-danger w-full"
          onClick={() => {
            if (confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) {
              storage.resetAll()
              alert('Dados locais limpos. A página será recarregada.')
              window.location.reload()
            }
          }}
        >
          🧹 Limpar dados (local)
        </button>
      </div>

      <button className="btn btn-danger w-full" onClick={clear}>
        🚪 Sair da Conta
      </button>
    </div>
  )
}
