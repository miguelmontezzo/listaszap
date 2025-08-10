// Dados mockados para desenvolvimento

export const mockUser = {
  id: '1',
  phone: '+5511999999999',
  name: 'João Silva'
}

export const mockCategories = [
  { id: '1', name: 'Frutas', color: '#ff6b6b', userId: '1' },
  { id: '2', name: 'Verduras', color: '#4ecdc4', userId: '1' },
  { id: '3', name: 'Carnes', color: '#45b7d1', userId: '1' },
  { id: '4', name: 'Laticínios', color: '#f9ca24', userId: '1' },
  { id: '5', name: 'Limpeza', color: '#6c5ce7', userId: '1' },
  { id: '6', name: 'Higiene', color: '#a29bfe', userId: '1' }
]

export const mockItems = [
  { id: '1', name: 'Banana', categoryId: '1', userId: '1', price: 5.80 }, // por kg
  { id: '2', name: 'Maçã', categoryId: '1', userId: '1', price: 7.90 }, // por kg
  { id: '3', name: 'Laranja', categoryId: '1', userId: '1', price: 4.50 }, // por kg
  { id: '4', name: 'Alface', categoryId: '2', userId: '1', price: 2.80 }, // por unidade
  { id: '5', name: 'Tomate', categoryId: '2', userId: '1', price: 6.20 }, // por kg
  { id: '6', name: 'Cebola', categoryId: '2', userId: '1', price: 3.50 }, // por kg
  { id: '7', name: 'Frango', categoryId: '3', userId: '1', price: 12.90 }, // por kg
  { id: '8', name: 'Carne Bovina', categoryId: '3', userId: '1', price: 35.80 }, // por kg
  { id: '9', name: 'Leite', categoryId: '4', userId: '1', price: 4.20 }, // por litro
  { id: '10', name: 'Queijo', categoryId: '4', userId: '1', price: 18.50 }, // por kg
  { id: '11', name: 'Detergente', categoryId: '5', userId: '1', price: 2.50 }, // por unidade
  { id: '12', name: 'Sabão em Pó', categoryId: '5', userId: '1', price: 8.90 }, // por unidade
  { id: '13', name: 'Shampoo', categoryId: '6', userId: '1', price: 15.60 }, // por unidade
  { id: '14', name: 'Pasta de Dente', categoryId: '6', userId: '1', price: 6.40 } // por unidade
]

export const mockLists = [
  {
    id: '1',
    name: 'Compras da Semana',
    description: 'Lista principal para compras do supermercado',
    createdAt: '2024-01-15T10:00:00Z',
    userId: '1',
    items: [
      { id: '1', itemId: '1', quantity: 6, checked: false, price: 3.50 },
      { id: '2', itemId: '4', quantity: 1, checked: true, price: 2.80 },
      { id: '3', itemId: '7', quantity: 1, checked: false, price: 12.90 },
      { id: '4', itemId: '9', quantity: 2, checked: false, price: 4.20 },
      { id: '5', itemId: '11', quantity: 1, checked: true, price: 2.50 }
    ]
  },
  {
    id: '2',
    name: 'Churrasco do Final de Semana',
    description: 'Ingredientes para o churrasco em família',
    createdAt: '2024-01-14T15:30:00Z',
    userId: '1',
    items: [
      { id: '6', itemId: '8', quantity: 2, checked: false, price: 25.80 },
      { id: '7', itemId: '5', quantity: 3, checked: false, price: 1.50 },
      { id: '8', itemId: '6', quantity: 2, checked: true, price: 2.10 }
    ]
  },
  {
    id: '3',
    name: 'Produtos de Limpeza',
    description: 'Reposição de produtos de limpeza da casa',
    createdAt: '2024-01-13T09:20:00Z',
    userId: '1',
    items: [
      { id: '9', itemId: '11', quantity: 2, checked: false, price: 2.50 },
      { id: '10', itemId: '12', quantity: 1, checked: false, price: 8.90 },
      { id: '11', itemId: '13', quantity: 1, checked: true, price: 15.60 }
    ]
  }
]

// Função para simular delay de API
export const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock das funções de API
export const mockApi = {
  // Auth
  requestOtp: async (phone: string) => {
    await delay()
    console.log('📱 Código OTP enviado para:', phone)
    return { success: true, message: 'Código enviado com sucesso' }
  },

  verifyOtp: async (phone: string, code: string) => {
    await delay()
    // Aceita qualquer código para facilitar desenvolvimento
    if (code.length >= 4) {
      return { 
        success: true, 
        token: 'mock-jwt-token-12345',
        user: mockUser
      }
    }
    throw new Error('Código inválido')
  },

  // Lists
  getLists: async () => {
    await delay()
    return mockLists
  },

  getList: async (id: string) => {
    await delay()
    const list = mockLists.find(l => l.id === id)
    if (!list) throw new Error('Lista não encontrada')
    return list
  },

  createList: async (data: { 
    name: string; 
    description?: string;
    type?: string;
    splitEnabled?: boolean;
    memberCount?: number;
    memberNames?: string[];
    initialItems?: string[];
  }) => {
    await delay()
    
    // Criar itens iniciais se fornecidos
    const initialListItems = (data.initialItems || []).map((itemId, index) => ({
      id: `${Date.now()}-${index}`,
      itemId,
      quantity: 1,
      checked: false,
      price: 0
    }))
    
    const newList = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      type: data.type || 'personal',
      splitEnabled: data.splitEnabled || false,
      memberCount: data.memberCount || 1,
      memberNames: data.memberNames || [],
      createdAt: new Date().toISOString(),
      userId: '1',
      items: initialListItems
    }
    mockLists.push(newList)
    return newList
  },

  // Items
  getItems: async () => {
    await delay()
    return mockItems
  },

  createItem: async (data: { name: string; categoryId: string }) => {
    await delay()
    const newItem = {
      id: Date.now().toString(),
      ...data,
      userId: '1',
      price: 0 // Preço padrão para novos itens
    }
    mockItems.push(newItem)
    return newItem
  },

  // Categories
  getCategories: async () => {
    await delay()
    return mockCategories
  },

  createCategory: async (data: { name: string; color: string }) => {
    await delay()
    const newCategory = {
      id: Date.now().toString(),
      ...data,
      userId: '1'
    }
    mockCategories.push(newCategory)
    return newCategory
  }
}