
import { Outlet, NavLink } from 'react-router-dom'
import { ListChecks, PackageOpen, FolderTree, UserRound } from 'lucide-react'

export function Layout() {

  return (
    <div className="min-h-screen">
      <div className="topbar">
        <div className="container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div className="font-bold text-xl text-gray-900">ListasZap</div>
          </div>
          <NavLink 
            to="/perfil" 
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200 active:scale-95"
          >
            <UserRound size={20} className="text-gray-600" />
          </NavLink>
        </div>
      </div>
      <div className="page">
        <Outlet />
      </div>

      <nav className="tabbar">
        <div className="container">
          <NavLink to="/listas">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <ListChecks size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Listas
                </span>
              </div>
            )}
          </NavLink>
          <NavLink to="/itens">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <PackageOpen size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Itens
                </span>
              </div>
            )}
          </NavLink>
          <NavLink to="/categorias">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <FolderTree size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Categorias
                </span>
              </div>
            )}
          </NavLink>
          <NavLink to="/perfil">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <UserRound size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Perfil
                </span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
