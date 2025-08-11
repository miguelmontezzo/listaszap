
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { RequestOtp } from '../features/auth/RequestOtp'
import { VerifyOtp } from '../features/auth/VerifyOtp'
import { ListsPage } from '../features/lists/ListsPage'
import { ListDetailPage } from '../features/lists/ListDetailPage'
import { InventoryPage } from '../features/inventory/InventoryPage'
import { ChargeDetailPage } from '../features/accounts/ChargeDetailPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { PayBillPage } from '../features/accounts/PayBillPage'
import { AccountsPage } from '../features/accounts/AccountsPage'
import { ContactsPage } from '../features/contacts/ContactsPage'

export const router = createBrowserRouter([
  { path: '/auth/entrar', element: <RequestOtp /> },
  { path: '/auth/codigo', element: <VerifyOtp /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/listas" replace /> },
      { path: 'listas', element: <ListsPage /> },
      { path: 'listas/:id', element: <ListDetailPage /> },
      { path: 'itens', element: <InventoryPage /> },
      { path: 'contas/:id', element: <ChargeDetailPage /> },
      { path: 'contas/:id/pagar', element: <PayBillPage /> },
      { path: 'contas', element: <AccountsPage /> },
      { path: 'contatos', element: <ContactsPage /> },
      { path: 'perfil', element: <ProfilePage /> },
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
])
