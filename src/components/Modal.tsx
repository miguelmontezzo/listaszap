import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  autoHeight?: boolean
}

export function useResponsiveModalSizing() {
  const [dimensions, setDimensions] = useState({
    height: '75vh',
    maxHeight: '600px',
    minHeight: '320px',
    padding: 'p-3',
    borderRadius: 'rounded-2xl',
    topSpacing: 'pt-16'
  })

  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight
      const vw = window.innerWidth
      
      // Calcular dimensões proporcionais baseadas no viewport
      let heightPercentage = 75
      let maxHeightPx = 600
      let minHeightPx = 320
      let padding = 'p-3'
      let borderRadius = 'rounded-2xl'
      let topSpacing = 'pt-16'

      // Telas muito pequenas (< 400px altura ou < 350px largura)
      if (vh < 400 || vw < 350) {
        heightPercentage = 80
        maxHeightPx = vh - 60 // Deixa mais margem para não ficar grudado
        minHeightPx = Math.min(280, vh - 80)
        padding = 'p-2'
        borderRadius = 'rounded-xl'
        topSpacing = 'pt-4'
      }
      // Telas pequenas (400-600px altura)
      else if (vh < 600) {
        heightPercentage = 75
        maxHeightPx = vh - 80
        minHeightPx = 300
        padding = 'p-2.5'
        borderRadius = 'rounded-xl'
        topSpacing = 'pt-8'
      }
      // Telas médias (600-800px altura)
      else if (vh < 800) {
        heightPercentage = 70
        maxHeightPx = 500
        minHeightPx = 320
        padding = 'p-3'
        borderRadius = 'rounded-2xl'
        topSpacing = 'pt-12'
      }
      // Telas grandes (>= 800px altura)
      else {
        heightPercentage = 65
        maxHeightPx = 600
        minHeightPx = 350
        padding = 'p-4'
        borderRadius = 'rounded-3xl'
        topSpacing = 'pt-20'
      }

      setDimensions({
        height: `${heightPercentage}vh`,
        maxHeight: `${maxHeightPx}px`,
        minHeight: `${minHeightPx}px`,
        padding,
        borderRadius,
        topSpacing
      })
    }

    // Executar imediatamente
    updateDimensions()

    // Listener para mudanças no tamanho da tela
    window.addEventListener('resize', updateDimensions)
    window.addEventListener('orientationchange', updateDimensions)

    return () => {
      window.removeEventListener('resize', updateDimensions)
      window.removeEventListener('orientationchange', updateDimensions)
    }
  }, [])

  return dimensions
}

export function Modal({ isOpen, onClose, title, children, autoHeight = false }: ModalProps) {
  const { height, maxHeight, minHeight, padding, borderRadius, topSpacing } = useResponsiveModalSizing()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`flex min-h-full items-start justify-center ${padding} ${topSpacing}`}>
        <div 
          className={`relative w-full max-w-sm sm:max-w-md bg-white ${borderRadius} shadow-xl transform transition-all ${autoHeight ? '' : 'flex flex-col'}`} 
          style={autoHeight ? { maxHeight } : { height, maxHeight, minHeight }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between ${padding === 'p-2' ? 'p-2' : 'p-3'} border-b border-gray-100 flex-shrink-0`}>
            <h2 className={`font-bold text-gray-900 ${padding === 'p-2' ? 'text-base' : 'text-lg'}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`${padding === 'p-2' ? 'w-6 h-6' : 'w-7 h-7'} rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200 active:scale-95`}
            >
              <X size={padding === 'p-2' ? 14 : 16} className="text-gray-600" />
            </button>
          </div>
          
          {/* Content */}
          <div className={`${autoHeight ? '' : 'flex-1 overflow-y-auto'}`} style={autoHeight ? undefined : { minHeight: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}