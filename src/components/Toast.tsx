import { create } from 'zustand'

type Toast = { id: number; message: string }

type ToastStore = {
  toasts: Toast[]
  show: (message: string) => void
  remove: (id: number) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (message) => set((s) => {
    const id = Date.now()
    const next = [...s.toasts, { id, message }]
    // auto remove after 2.5s
    setTimeout(() => {
      set((curr) => ({ toasts: curr.toasts.filter(t => t.id !== id) }))
    }, 2500)
    return { toasts: next }
  }),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}))

export function ToastContainer() {
  const { toasts, remove } = useToast()
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-2 bg-green-600 text-white rounded-full shadow" onClick={() => remove(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

