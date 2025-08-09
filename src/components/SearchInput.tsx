
import { ChangeEvent } from 'react'

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange:(v:string)=>void; placeholder?:string }) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
  return <input className="input" value={value} onChange={handle} placeholder={placeholder||"Buscar..."} />
}
