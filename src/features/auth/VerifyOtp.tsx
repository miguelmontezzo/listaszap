
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/session'
import { storage } from '../../lib/storage'
import { api } from '../../lib/api'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { fetchUserInfoById } from '../../lib/supabase'
import { isSupabaseStorage } from '../../lib/storage'

export function VerifyOtp(){
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const nav = useNavigate()
  const { setSession } = useSession()

  async function submit() {
    const phone = sessionStorage.getItem('lz_phone')||''
    setLoading(true)
    try {
      // n8n recebe sem 55; o app armazena canônico com 55
      const without55 = phone.replace(/\D/g,'').replace(/^55/, '')
      const { token, user } = await api.verifyOtpZapLista(without55, code)
      // Fallback de nome: usa o nome informado no cadastro se o backend não preencher
      const signupName = (sessionStorage.getItem('lz_signup_name') || '').trim()
      const mergedUser = { ...user, name: user.name || signupName || 'Usuário' }
      setSession({ token, user: mergedUser })
      // Buscar informações no Supabase somente se o driver ativo for Supabase
      if (isSupabaseStorage) {
        try {
          const { data, error } = await fetchUserInfoById(user.id)
          if (error) {
            console.warn('Supabase error:', error)
          } else if (data) {
            const merged = { ...mergedUser, ...data }
            setSession({ token, user: merged })
          }
        } catch (err) {
          console.warn('Falha ao buscar perfil no Supabase', err)
        }
      }
      // Inicializar storage e seeds para o usuário recém autenticado
      storage.initForCurrentUser()
      nav('/listas')
    } catch (e:any) {
      const msg = String(e?.message || '')
      if (/usu[aá]rio n[aã]o existe/i.test(msg)) {
        setSignupOpen(true)
      } else {
        alert(msg || 'Erro')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup() {
    try {
      const phone = sessionStorage.getItem('lz_phone')||''
      const without55 = phone.replace(/\D/g,'').replace(/^55/, '')
      await api.requestOtpZapLista(without55)
      setSignupOpen(false)
      alert('Enviamos um código para o seu WhatsApp. Digite-o para concluir o cadastro.')
    } catch (e:any) {
      alert(e?.message || 'Erro ao iniciar cadastro')
    }
  }

  async function resend() {
    const phone = sessionStorage.getItem('lz_phone') || ''
    if (!phone) return
    try {
      // webhook espera sem 55
      const without55 = phone.replace(/\D/g,'').replace(/^55/, '')
      await api.requestOtpZapLista(without55)
      alert('Código reenviado!')
    } catch (e:any) {
      alert(e.message || 'Erro ao reenviar código')
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl">
            <img src="https://i.ibb.co/LXT41BLJ/logoicone.png" alt="ListasZap" className="w-full h-full object-cover" />
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
          
          <div className="text-xs text-gray-500 text-center">Digite o código recebido no seu WhatsApp.</div>
          
          <button className="text-sm text-green-600 hover:text-green-700 text-center w-full">
            <span onClick={resend}>Não recebeu o código? Reenviar</span>
          </button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={signupOpen}
        title="Crie sua conta grátis"
        description="Usuário não existe. Crie sua conta agora, é grátis. Vamos enviar um código para confirmar."
        confirmLabel="Cadastre-se"
        cancelLabel="Voltar"
        onConfirm={handleSignup}
        onCancel={()=>setSignupOpen(false)}
      />
    </div>
  )
}
