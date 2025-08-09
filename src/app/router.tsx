
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { RequestOtp } from '../features/auth/RequestOtp'
import { VerifyOtp } from '../features/auth/VerifyOtp'
import { ListsPage } from '../features/lists/ListsPage'
import { ListDetailPage } from '../features/lists/ListDetailPage'
import { ItemsPage } from '../features/items/ItemsPage'
import { CategoriesPage } from '../features/categories/CategoriesPage'
import { ProfilePage } from '../features/profile/ProfilePage'

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
      { path: 'itens', element: <ItemsPage /> },
      { path: 'categorias', element: <CategoriesPage /> },
      { path: 'perfil', element: <ProfilePage /> },
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
])
