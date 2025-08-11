
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// Mock de envio de OTP substituído por lógica local

export function RequestOtp(){
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const normalize = (v:string) => v.replace(/\D/g, '').replace(/^55?/, '55')

  async function submit() {
    setLoading(true)
    try {
      // Simula envio de OTP e salva phone temporário
      sessionStorage.setItem('lz_request_id', 'mock-request-id')
      sessionStorage.setItem('lz_phone', normalize(phone))
      nav('/auth/codigo')
    } catch (e:any) {
      alert(e.message||'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao ListasZap</h1>
            <p className="text-gray-600 mt-2">Digite seu WhatsApp para continuar</p>
          </div>
        </div>
        
        <div className="card space-y-4 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do WhatsApp
            </label>
            <input 
              className="input" 
              placeholder="(11) 99999-9999" 
              value={phone} 
              onChange={e=>setPhone(e.target.value)}
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
          
          <div className="text-xs text-gray-500 text-center">
            💡 <strong>Modo desenvolvimento:</strong> Digite qualquer número para testar
          </div>
        </div>
      </div>
    </div>
  )
}
