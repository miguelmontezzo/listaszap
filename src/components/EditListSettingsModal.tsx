import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { storage, type ShoppingList } from '../lib/storage'
import { api } from '../lib/api'

interface EditListSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  list: ShoppingList | null
  onSaved?: (updated: ShoppingList) => void
}

export function EditListSettingsModal({ isOpen, onClose, list, onSaved }: EditListSettingsModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [includeOwner, setIncludeOwner] = useState(false)
  const [listType, setListType] = useState<'personal'|'shared'>('personal')
  const [allowInvite, setAllowInvite] = useState(false)

  useEffect(() => {
    if (!isOpen || !list) return
    setName(list.name || '')
    setDescription(list.description || '')
    setSplitEnabled(!!list.splitEnabled)
    setIncludeOwner(!!list.includeOwnerInSplit)
    setListType(list.type || 'personal')
    setAllowInvite(!!list.allowMembersToInvite)
  }, [isOpen, list])

  if (!list) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!list) return
    // Enviar webhook de configuração com booleans reais
    const isShared = listType === 'shared'
    await api.configurarListaViaWebhook({
      id_lista: list.id,
      nome: name.trim() || list.name,
      descricao: description,
      pessoal: !isShared,
      compartilhada: isShared,
      split_enabled: isShared ? !!splitEnabled : false,
      include_owner_in_split: isShared ? !!includeOwner : false,
      allow_members_invite: isShared ? !!allowInvite : false,
    })

    // Após a webhook, atualizar UI apenas com leitura (sem escrever no Supabase)
    // Poll curto para esperar o n8n persistir as mudanças
    let updated: ShoppingList | null = null
    for (let i = 0; i < 6; i++) {
      try {
        updated = await storage.getList(list.id)
        break
      } catch {}
      await new Promise(r => setTimeout(r, 500))
    }
    if (updated) onSaved?.(updated)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Lista">
      <div className="flex flex-col" style={{ height: '100%' }}>
        <form id="edit-list-form" onSubmit={submit} className="flex-1 p-4 space-y-4 modal-scroll" style={{ minHeight: 0 }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input className="input" value={name} onChange={(e)=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <input className="input" value={description} onChange={(e)=>setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de lista</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={`p-3 rounded-xl border-2 ${listType==='personal'?'border-green-500 bg-green-50 text-green-700':'border-gray-200'}`} onClick={()=>setListType('personal')}>Pessoal</button>
              <button type="button" className={`p-3 rounded-xl border-2 ${listType==='shared'?'border-green-500 bg-green-50 text-green-700':'border-gray-200'}`} onClick={()=>setListType('shared')}>Compartilhada</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dividir custos</label>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-800">Ativar divisão por pessoa</div>
                <div className="text-xs text-gray-500">Quando ativado, a lista aparece em Contas</div>
              </div>
              <input type="checkbox" className="w-5 h-5" checked={splitEnabled} onChange={(e)=>setSplitEnabled(e.target.checked)} disabled={listType==='personal'} />
            </div>
            {listType==='personal' && <div className="text-xs text-gray-400 mt-1">Para dividir custos, mude o tipo para Compartilhada</div>}
            {listType==='shared' && splitEnabled && (
              <div className="mt-3 flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-800">Me incluir como pagante</div>
                  <div className="text-xs text-gray-500">Inclui o dono da lista na divisão</div>
                </div>
                <input type="checkbox" className="w-5 h-5" checked={includeOwner} onChange={(e)=>setIncludeOwner(e.target.checked)} />
              </div>
            )}
            {listType==='shared' && (
              <div className="mt-3 flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-800">Permitir membros convidarem</div>
                  <div className="text-xs text-gray-500">Quando desligado, só o dono adiciona membros</div>
                </div>
                <input type="checkbox" className="w-5 h-5" checked={allowInvite} onChange={(e)=>setAllowInvite(e.target.checked)} />
              </div>
            )}
          </div>
        </form>
        <div className="border-t border-gray-100 p-3" style={{ flexShrink: 0 }}>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
            <button type="submit" form="edit-list-form" className="btn flex-1">Salvar</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

