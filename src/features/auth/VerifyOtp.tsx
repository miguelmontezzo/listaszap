
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/session'

export function VerifyOtp(){
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { setSession } = useSession()

  async function submit() {
    const phone = sessionStorage.getItem('lz_phone')||''
    setLoading(true)
    try {
      // Qualquer código com 4+ dígitos é aceito em dev; cria usuário simples
      const user = { id: '1', phone, name: 'João Silva' }
      setSession({ token: 'local-token', user })
      nav('/listas')
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
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Digite o código</h1>
            <p className="text-gray-600 mt-2">
              Código enviado para <span className="font-medium">{sessionStorage.getItem('lz_phone')||''}</span>
            </p>
          </div>
        </div>
        
        <div className="card space-y-4 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de verificação
            </label>
            <input 
              className="input text-center text-2xl tracking-widest" 
              placeholder="000000" 
              value={code} 
              onChange={e=>setCode(e.target.value)}
              maxLength={6}
              type="tel"
            />
          </div>
          
          <button 
            className="btn w-full" 
            onClick={submit} 
            disabled={loading || code.length<4}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Validando código...
              </div>
            ) : (
              'Confirmar e entrar'
            )}
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            💡 <strong>Modo desenvolvimento:</strong> Digite qualquer código com 4+ dígitos
          </div>
          
          <button className="text-sm text-green-600 hover:text-green-700 text-center w-full">
            Não recebeu o código? Reenviar
          </button>
        </div>
      </div>
    </div>
  )
}
