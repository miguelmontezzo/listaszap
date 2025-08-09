import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/session'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useSession()

  // Se não tem usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/auth/entrar" replace />
  }

  // Se tem usuário, renderiza o conteúdo protegido
  return <>{children}</>
}