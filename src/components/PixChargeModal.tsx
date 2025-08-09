import { useState } from 'react'
import { Copy, DollarSign, Phone, Mail, CreditCard, Hash, Shuffle } from 'lucide-react'
import { Modal } from './Modal'

interface PixChargeModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  memberCount: number
  amountPerPerson: number
  listName: string
  members: { id: string; name: string }[]
}

type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | 'copy-paste'

const pixKeyTypes = [
  { 
    id: 'cpf' as PixKeyType, 
    name: 'CPF', 
    icon: CreditCard, 
    placeholder: '000.000.000-00',
    mask: '###.###.###-##'
  },
  { 
    id: 'cnpj' as PixKeyType, 
    name: 'CNPJ', 
    icon: CreditCard, 
    placeholder: '00.000.000/0000-00',
    mask: '##.###.###/####-##'
  },
  { 
    id: 'email' as PixKeyType, 
    name: 'E-mail', 
    icon: Mail, 
    placeholder: 'seu@email.com'
  },
  { 
    id: 'phone' as PixKeyType, 
    name: 'Telefone', 
    icon: Phone, 
    placeholder: '(11) 99999-9999',
    mask: '(##) #####-####'
  },
  { 
    id: 'random' as PixKeyType, 
    name: 'Chave Aleatória', 
    icon: Hash, 
    placeholder: '1234abcd-5678-efgh-9012-ijklmnopqrst'
  },
  { 
    id: 'copy-paste' as PixKeyType, 
    name: 'Copia e Cola', 
    icon: Copy, 
    placeholder: 'Cole o código PIX aqui...'
  }
]

export function PixChargeModal({ 
  isOpen, 
  onClose, 
  totalAmount, 
  memberCount, 
  amountPerPerson, 
  listName,
  members 
}: PixChargeModalProps) {
  const [selectedKeyType, setSelectedKeyType] = useState<PixKeyType>('cpf')
  const [pixKey, setPixKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const selectedType = pixKeyTypes.find(type => type.id === selectedKeyType)

  const applyMask = (value: string, mask?: string) => {
    if (!mask) return value
    
    let maskedValue = ''
    let valueIndex = 0
    
    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
      if (mask[i] === '#') {
        maskedValue += value[valueIndex]
        valueIndex++
      } else {
        maskedValue += mask[i]
      }
    }
    
    return maskedValue
  }

  const handlePixKeyChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const maskedValue = selectedType?.mask ? applyMask(cleanValue, selectedType.mask) : value
    setPixKey(maskedValue)
  }

  const generatePixMessage = () => {
    const message = `🛒 *${listName}*\n\n` +
      `💰 Sua parte: *R$ ${amountPerPerson.toFixed(2)}*\n` +
      `👥 Total dividido entre ${memberCount} pessoas\n\n` +
      `📋 *PIX para pagamento:*\n` +
      `${pixKey}\n\n` +
      `✅ Após o pagamento, confirme no grupo!\n\n` +
      `_Enviado pelo ListasZap 📱_`
    
    return encodeURIComponent(message)
  }

  const handleSendCharges = async () => {
    if (!pixKey.trim()) {
      alert('Por favor, informe sua chave PIX')
      return
    }

    setIsLoading(true)
    
    try {
      const message = generatePixMessage()
      
      // Simular envio para cada membro
      for (const member of members) {
        // Para demonstração, vamos simular o WhatsApp Web
        // Na implementação real, seria integrado com a API do WhatsApp Business
        const whatsappUrl = `https://wa.me/?text=${message}`
        
        // Abrir em nova aba (em produção seria enviado automaticamente)
        window.open(whatsappUrl, '_blank')
        
        // Aguardar um pouco entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      alert(`Cobrança enviada para ${members.length} pessoas!`)
      onClose()
      
    } catch (error) {
      console.error('Erro ao enviar cobranças:', error)
      alert('Erro ao enviar cobranças. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setPixKey('')
    setSelectedKeyType('cpf')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cobrar Membros">
      <div className="flex flex-col" style={{ height: '100%' }}>
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 modal-scroll">
          <div className="space-y-4">
            {/* Resumo da Cobrança */}
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-green-600" />
                <h3 className="font-semibold text-green-800">Resumo da Cobrança</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-green-800">R$ {totalAmount.toFixed(2)}</div>
                  <div className="text-xs text-green-600">Total</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-800">{memberCount}</div>
                  <div className="text-xs text-green-600">Pessoas</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-800">R$ {amountPerPerson.toFixed(2)}</div>
                  <div className="text-xs text-green-600">Por pessoa</div>
                </div>
              </div>
            </div>

            {/* Tipo de Chave PIX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo da Chave PIX
              </label>
              <div className="grid grid-cols-2 gap-2">
                {pixKeyTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setSelectedKeyType(type.id)
                        setPixKey('')
                      }}
                      className={`p-2 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-1 ${
                        selectedKeyType === type.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="text-xs font-medium">{type.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campo da Chave PIX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sua Chave PIX ({selectedType?.name})
              </label>
              <input
                type={selectedKeyType === 'email' ? 'email' : 'text'}
                value={pixKey}
                onChange={(e) => handlePixKeyChange(e.target.value)}
                placeholder={selectedType?.placeholder}
                className="input"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta chave será enviada para os membros da lista
              </p>
            </div>

            {/* Lista de Membros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cobrança será enviada para:
              </label>
              <div className="card bg-gray-50 border-gray-200 max-h-24 overflow-y-auto">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900 font-medium">{member.name}</span>
                      </div>
                      <span className="text-green-600 font-semibold">R$ {amountPerPerson.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview da Mensagem */}
            {pixKey && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview da Mensagem
                </label>
                <div className="card bg-gray-50 border-gray-200 max-h-32 overflow-y-auto">
                  <div className="text-sm text-gray-700 whitespace-pre-line font-mono">
                    {`🛒 ${listName}\n\n💰 Sua parte: R$ ${amountPerPerson.toFixed(2)}\n👥 Total dividido entre ${memberCount} pessoas\n\n📋 PIX para pagamento:\n${pixKey}\n\n✅ Após o pagamento, confirme no grupo!\n\n_Enviado pelo ListasZap 📱_`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões Fixos */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => onClose()}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSendCharges}
              disabled={!pixKey.trim() || isLoading}
              className="btn flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enviando...</span>
                </div>
              ) : (
                'Enviar Cobrança'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}