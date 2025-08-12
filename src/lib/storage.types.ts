export type Category = { id: string; name: string; color: string }

export type Item = {
  id: string
  name: string
  categoryId: string
  price?: number
  defaultUnit?: 'unidade' | 'peso'
  defaultQty?: number
}

export type ListItem = {
  id: string
  itemId: string
  quantity: number
  checked: boolean
  price: number
  unit?: 'unidade' | 'peso'
  createdBy?: string
}

export type ShoppingList = {
  id: string
  name: string
  description?: string
  createdAt: string
  userId: string
  items: ListItem[]
  type?: 'personal' | 'shared'
  memberCount?: number
  memberNames?: string[]
  memberPhones?: string[]
  splitEnabled?: boolean
  includeOwnerInSplit?: boolean
  charges?: {
    byMember: { name: string; status: 'pendente' | 'cobrado' | 'pago'; proofName?: string }[]
  }
  allowMembersToInvite?: boolean
}

