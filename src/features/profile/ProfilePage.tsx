
import { useEffect, useState } from 'react'
import { useSession } from '../../lib/session'
import { storage } from '../../lib/storage'
import { SuccessModal } from '../../components/SuccessModal'

export function ProfilePage(){
  const { user, clear } = useSession()
  const [name, setName] = useState(user?.name||'')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  

  useEffect(() => {
    // Carregar perfil salvo por usuário (chave por ID)
    try {
      const key = user?.id ? `lz_profile_${user.id}` : 'lz_profile'
      const raw = localStorage.getItem(key)
      if (raw) {
        const p = JSON.parse(raw) as { name?: string; email?: string; city?: string }
        setName(p.name || user?.name || '')
        setEmail(p.email || '')
        setCity(p.city || '')
      } else {
        // Sem perfil salvo: usar dados da sessão
        setName(user?.name || '')
        setEmail('')
        setCity('')
      }
      // Migração: remover perfil global antigo para evitar poluição entre contas
      if (localStorage.getItem('lz_profile')) localStorage.removeItem('lz_profile')
    } catch {
      setName(user?.name || '')
    }
  }, [user?.id])

  async function handleSave() {
    const profile = { name: name.trim(), email: email.trim(), city: city.trim() }
    const key = user?.id ? `lz_profile_${user.id}` : 'lz_profile'
    localStorage.setItem(key, JSON.stringify(profile))
    // atualiza nome na sessão (mantém id/phone)
    if (user) {
      useSession.setState({ user: { ...user, name: profile.name } })
    }
    setShowSaved(true)
  }

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
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Opcional" />
        <div className="text-sm text-neutral-500">Cidade</div>
        <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Opcional" />
        <button className="btn w-full" onClick={handleSave}>Salvar Alterações</button>
      </div>

      {/* Removido botão de limpar dados conforme solicitado */}

      <button className="btn btn-danger w-full" style={{ borderRadius: 20 }} onClick={clear}>
        🚪 Sair da Conta
      </button>
      <SuccessModal isOpen={showSaved} onClose={()=>setShowSaved(false)} title="Tudo certo!" message="Seus dados foram salvos." />
    </div>
  )
}
