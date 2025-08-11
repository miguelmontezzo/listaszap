
import { Outlet, NavLink } from 'react-router-dom'
import { ListChecks, PackageOpen, FolderTree, UserRound, Users } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { ToastContainer } from '../components/Toast'

export function Layout() {

  return (
    <div className="min-h-screen">
      <div className="topbar">
        <div className="container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <img src="https://i.ibb.co/LXT41BLJ/logoicone.png" alt="ListasZap" className="w-full h-full object-cover" onError={(e)=>{ (e.currentTarget as HTMLImageElement).src='/favicon.ico' }} />
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
        <ToastContainer />
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
          
          <NavLink to="/contas">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <DollarSign size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Contas
                </span>
              </div>
            )}
          </NavLink>
          <NavLink to="/contatos">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <Users size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Contatos
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
