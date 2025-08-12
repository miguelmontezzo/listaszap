
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

export function SignupPage(){
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('lz_phone') || ''
    setPhone(saved.replace(/\D/g, ''))
  }, [])

  const normalizeForWebhook = (v:string) => {
    const d = v.replace(/\D/g, '')
    return d.startsWith('55') ? d.slice(2) : d
  }

  async function submit(){
    setLoading(true)
    try {
      // guarda nome fornecido para usar como fallback após verificação
      sessionStorage.setItem('lz_signup_name', name.trim())
      const whatsapp = normalizeForWebhook(phone)
      const res = await api.createUserZapLista(whatsapp, name.trim() || 'Usuário')
      if (!res.success) throw new Error(res.message || 'Falha ao criar usuário')
      nav('/auth/codigo')
    } catch (e:any) {
      alert(e?.message || 'Erro ao iniciar cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Crie sua conta grátis</h1>
          <p className="text-gray-600 text-sm">Preencha seus dados para receber o código de confirmação.</p>
        </div>

        <div className="card space-y-4 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seu nome</label>
            <input className="input" placeholder="Seu nome" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número do WhatsApp</label>
            <input className="input" placeholder="(11) 99999-9999" value={phone} onChange={e=>setPhone(e.target.value)} type="tel" />
          </div>
          <button className="btn w-full" onClick={submit} disabled={loading || phone.replace(/\D/g,'').length < 10}>
            {loading ? 'Enviando...' : 'Enviar código de confirmação'}
          </button>
          <button className="btn w-full bg-gray-100 text-gray-800" onClick={()=>nav('/auth/entrar')}>Voltar</button>
        </div>
      </div>
    </div>
  )
}

