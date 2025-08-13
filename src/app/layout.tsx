
import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { ListChecks, PackageOpen, FolderTree, UserRound, Users, BarChart3, Moon, Sun } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { ToastContainer } from '../components/Toast'

export function Layout() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  const [prefersDark, setPrefersDark] = useState<boolean>(false)
  const effectiveTheme: 'light' | 'dark' = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  const isDark = effectiveTheme === 'dark'

  // Inicializa preferências do SO e reage a mudanças
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setPrefersDark(mq.matches)
    const handle = (e: MediaQueryListEvent) => setPrefersDark(e.matches)
    mq.addEventListener?.('change', handle)
    return () => mq.removeEventListener?.('change', handle)
  }, [])

  // Carrega o tema salvo e aplica sempre o tema efetivo (inclusive no modo sistema)
  useEffect(() => {
    const stored = localStorage.getItem('lz_theme') as 'system' | 'light' | 'dark' | null
    if (stored) setTheme(stored)
  }, [])

  // Aplica o tema efetivo e a theme-color sempre que tema ou preferência do SO mudarem
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', effectiveTheme)
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) meta.setAttribute('content', isDark ? '#0b0f14' : '#f5f6fa')
  }, [effectiveTheme, isDark])

  function toggleTheme() {
    // alterna entre system -> dark -> light -> system
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system'
    setTheme(next)
    localStorage.setItem('lz_theme', next)
  }

  return (
    <div className="min-h-screen">
      <div className="topbar">
        <div className="container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <img src="https://i.ibb.co/LXT41BLJ/logoicone.png" alt="ListasZap" className="w-full h-full object-cover" onError={(e)=>{ (e.currentTarget as HTMLImageElement).src='/favicon.ico' }} />
            </div>
            <div className="font-bold text-xl" style={{ color: 'hsl(var(--text))' }}>ListasZap</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Alternar tema"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className="theme-switch"
              data-checked={isDark}
            >
              <Moon size={12} className="theme-switch-icon left" />
              <Sun size={12} className="theme-switch-icon right" />
              <span className="theme-switch-knob" />
            </button>
            <NavLink 
              to="/perfil" 
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors active:scale-95"
              style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <UserRound size={20} className="" style={{ color: 'hsl(var(--text-secondary))' }} />
            </NavLink>
          </div>
        </div>
      </div>
      <div className="page">
        <Outlet />
        <ToastContainer />
      </div>

      <nav className="tabbar" role="navigation" aria-label="Menu principal">
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
          <NavLink to="/resumo">
            {({isActive}) => (
              <div className="tabbtn">
                <div className={`icon-container ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                    : 'text-gray-500'
                }`}>
                  <BarChart3 size={20} strokeWidth={2} />
                </div>
                <span className={`label ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  Resumo
                </span>
              </div>
            )}
          </NavLink>
          
        </div>
      </nav>
    </div>
  )
}
