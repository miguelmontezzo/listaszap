
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function RequestOtp(){
  const [phone, setPhone] = useState('+55 ')
  const [loading, setLoading] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [signupMessage, setSignupMessage] = useState('Usuário não existe. Crie sua conta grátis agora.')
  const nav = useNavigate()

  // Máscara com +55 automático e normalizações
  const formatPhoneWithBrazilDDI = (v: string) => {
    const digitsRaw = v.replace(/\D/g, '')
    const digits = digitsRaw.startsWith('55') ? digitsRaw : `55${digitsRaw}`
    const ddi = '+55'
    const rest = digits.slice(2)
    if (rest.length === 0) return `${ddi} `
    const ddd = rest.slice(0, 2)
    const num = rest.slice(2)
    // Define formatação progressiva
    if (num.length <= 4) return `${ddi} (${ddd}${num.length < 2 ? '' : ') '}${num}`
    if (num.length <= 9) return `${ddi} (${ddd}) ${num.slice(0, num.length - 4)}-${num.slice(-4)}`
    // 9 dígitos
    return `${ddi} (${ddd}) ${num.slice(0, 5)}-${num.slice(5, 9)}`
  }
  const normalizeForApp = (v:string) => {
    const d = v.replace(/\D/g, '')
    return d.startsWith('55') ? d : `55${d}`
  }
  const normalizeForWebhook = (v:string) => {
    const d = v.replace(/\D/g, '')
    return d.startsWith('55') ? d.slice(2) : d
  }

  async function submit() {
    setLoading(true)
    try {
      const phoneForApp = normalizeForApp(phone)
      const phoneForWebhook = normalizeForWebhook(phone)
      const { success, message } = await api.requestOtpZapLista(phoneForWebhook)
      sessionStorage.setItem('lz_phone', phoneForApp)
      if (success) {
        nav('/auth/codigo')
      } else {
        setSignupMessage(message || 'Usuário não existe. Crie sua conta grátis agora.')
        setShowSignup(true)
      }
    } catch (e:any) {
      // Mesmo em 4xx/5xx tentamos interpretar como "usuário não existe" para abrir o modal
      const msg = String(e?.message || '')
      if (/usu[aá]rio n[aã]o existe/i.test(msg)) {
        setSignupMessage('Usuário não existe. Crie sua conta grátis agora.')
        setShowSignup(true)
      } else {
        alert(msg || 'Erro ao enviar código')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignupConfirm() {
    try {
      const phoneForWebhook = normalizeForWebhook(phone)
      const { success } = await api.requestOtpZapLista(phoneForWebhook)
      if (success) {
        setShowSignup(false)
        nav('/auth/codigo')
      } else {
        alert('Não foi possível iniciar o cadastro agora. Tente novamente em instantes.')
      }
    } catch (e:any) {
      alert(e?.message || 'Erro ao iniciar cadastro')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl">
            <img src="https://i.ibb.co/LXT41BLJ/logoicone.png" alt="ListasZap" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao ListasZap</h1>
            <p className="text-gray-600 mt-2">Digite seu WhatsApp para continuar</p>
          </div>
        </div>
        
        <div className="card space-y-4 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número do WhatsApp</label>
            <input
              className="input"
              placeholder="+55 (11) 99999-9999"
              value={phone}
              onChange={e=>setPhone(formatPhoneWithBrazilDDI(e.target.value))}
              type="tel"
            />
          </div>
          
          <button 
            className="btn w-full" 
            onClick={submit} 
            disabled={loading || phone.length < 10}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando código...
              </div>
            ) : (
              'Enviar código de verificação'
            )}
          </button>
          
          <div className="text-xs text-gray-500 text-center">Um código será enviado para seu WhatsApp.</div>
        </div>
      </div>
      </div>
      <ConfirmDialog
        isOpen={showSignup}
        title="Crie sua conta grátis"
        description={signupMessage}
        confirmLabel="Cadastre-se"
        cancelLabel="Voltar"
        centered
        onConfirm={() => nav('/auth/cadastro')}
        onCancel={() => setShowSignup(false)}
      />
    </>
  )
}
