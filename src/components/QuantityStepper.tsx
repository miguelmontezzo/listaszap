import React from 'react'

type Unit = 'unidade' | 'peso'

interface QuantityStepperProps {
  value: string
  unit: Unit
  onChange: (next: string) => void
  className?: string
}

function clamp(value: number, min: number): number {
  if (Number.isNaN(value)) return min
  return value < min ? min : value
}

function formatValue(value: number, unit: Unit): string {
  if (unit === 'peso') {
    // Mostrar até 3 casas, removendo zeros desnecessários
    const fixed = value.toFixed(3)
    return fixed.replace(/\.0{1,3}$/,'').replace(/(\.\d*[1-9])0+$/,'$1')
  }
  return String(Math.round(value))
}

export function QuantityStepper({ value, unit, onChange, className = '' }: QuantityStepperProps) {
  const step = unit === 'peso' ? 0.1 : 1
  const min = unit === 'peso' ? 0.001 : 1

  const parsed = parseFloat(String(value).replace(',', '.'))
  const current = Number.isNaN(parsed) ? (unit === 'peso' ? 0.5 : 1) : parsed

  function decrement() {
    const next = clamp(current - step, min)
    onChange(formatValue(next, unit))
  }

  function increment() {
    const next = clamp(current + step, min)
    onChange(formatValue(next, unit))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (unit === 'unidade') {
      const onlyDigits = raw.replace(/\D/g, '')
      onChange(onlyDigits)
      return
    }
    // unidade 'peso': aceitar decimais (., ,) e números
    let cleaned = raw.replace(/[^0-9.,]/g, '')
    // normalizar para ponto como separador decimal
    cleaned = cleaned.replace(/,/g, '.')
    // manter apenas o primeiro ponto decimal
    const firstDot = cleaned.indexOf('.')
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
    }
    onChange(cleaned)
  }

  function handleBlur() {
    const num = parseFloat(String(value).replace(',', '.'))
    const normalized = clamp(num, min)
    onChange(formatValue(normalized, unit))
  }

  return (
    <div className={`flex items-center justify-between border border-gray-300 rounded-xl px-2 py-2 ${className}`}>
      <button
        type="button"
        onClick={decrement}
        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95"
        aria-label="Diminuir"
      >
        −
      </button>
      <div className="flex items-baseline gap-2">
        <input
          type="text"
          inputMode={unit === 'peso' ? 'decimal' : 'numeric'}
          value={String(value)}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-20 text-center py-1 bg-transparent outline-none border-0 text-lg font-medium text-gray-900"
          aria-label={unit === 'peso' ? 'Peso' : 'Quantidade'}
          placeholder={unit === 'peso' ? '0.5' : '1'}
        />
        <span className="text-sm text-gray-500">{unit === 'peso' ? 'kg' : 'un'}</span>
      </div>
      <button
        type="button"
        onClick={increment}
        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  )
}

