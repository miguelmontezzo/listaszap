
interface ItemRowProps {
  name: string
  checked: boolean
  qty?: number
  price?: number
  category?: string
  onToggle?: (v: boolean) => void
}

export function ItemRow({ name, checked, qty, price, category, onToggle }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-4 flex-1 cursor-pointer">
        {/* Custom Checkbox */}
        <div 
          className="relative cursor-pointer"
          onClick={() => onToggle?.(!checked)}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              checked
                ? 'bg-green-500 border-green-500 shadow-sm'
                : 'border-gray-300 bg-white hover:border-green-400'
            }`}
          >
            {checked && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Item Info */}
        <div className="flex-1">
          <div className={`font-medium transition-all duration-200 ${
            checked ? 'line-through text-gray-400' : 'text-gray-900'
          }`}>
            {name}
          </div>
          {category && (
            <div className="text-xs text-gray-500 mt-0.5">{category}</div>
          )}
        </div>
      </div>

      {/* Price and Quantity */}
      <div className="text-right">
        {qty && (
          <div className="text-sm font-medium text-gray-600">
            x{qty}
          </div>
        )}
        {price && (
          <div className={`text-sm font-semibold transition-all duration-200 ${
            checked ? 'text-gray-400' : 'text-green-600'
          }`}>
            R$ {price.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}
