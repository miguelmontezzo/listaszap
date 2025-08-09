
export function EmptyState({ title, children }: { title: string; children?: any }) {
  return (
    <div className="card text-center text-neutral-600">
      <div className="font-semibold">{title}</div>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  )
}
