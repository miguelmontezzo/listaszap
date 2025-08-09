
import { create } from 'zustand'

type User = { id: string; phone: string; name: string }
type SessionState = {
  token?: string
  user?: User
  setSession: (s: { token: string; user: User }) => void
  clear: () => void
}

export const useSession = create<SessionState>((set) => ({
  token: undefined,
  user: undefined,
  setSession: (s) => {
    localStorage.setItem('lz_session', JSON.stringify(s))
    set(s)
  },
  clear: () => {
    localStorage.removeItem('lz_session')
    set({ token: undefined, user: undefined })
  }
}))

// hydrate on load
const raw = localStorage.getItem('lz_session')
if (raw) {
  try {
    const s = JSON.parse(raw)
    // naive hydration only if has user
    if (s?.user) {
      useSession.setState(s)
    }
  } catch {}
}
