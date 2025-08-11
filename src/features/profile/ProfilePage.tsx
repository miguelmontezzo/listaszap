
import { useEffect, useState } from 'react'
import { useSession } from '../../lib/session'
import { storage } from '../../lib/storage'

export function ProfilePage(){
  const { user, clear } = useSession()
  const [name, setName] = useState(user?.name||'')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    // carregar perfil salvo (se existir)
    try {
      const raw = localStorage.getItem('lz_profile')
      if (raw) {
        const p = JSON.parse(raw) as { name?: string; email?: string; city?: string }
        if (p.name) setName(p.name)
        if (p.email) setEmail(p.email)
        if (p.city) setCity(p.city)
      }
      // fallback de email/cidade
      if (!email) setEmail('')
      if (!city) setCity('')
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    const profile = { name: name.trim(), email: email.trim(), city: city.trim() }
    localStorage.setItem('lz_profile', JSON.stringify(profile))
    // atualiza nome na sessão (mantém id/phone)
    if (user) {
      useSession.setState({ user: { ...user, name: profile.name } })
    }
    alert('Dados salvos!')
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
    </div>
  )
}
