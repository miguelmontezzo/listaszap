
export function ListCard({ name, progress, total, real, onClick }:
  { name: string; progress: number; total: number; real: number; onClick?:()=>void }) {
  return (
    <button onClick={onClick} className="card w-full text-left active:scale-[0.98] transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{name}</h3>
        <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {progress}%
        </div>
      </div>
      
      <div className="progress-bar mb-3">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="text-gray-600">
          <span className="text-gray-500">Estimado:</span> R$ {total.toFixed(2)}
        </div>
        <div className="font-medium text-gray-900">
          <span className="text-gray-500">Gasto:</span> R$ {real.toFixed(2)}
        </div>
      </div>
    </button>
  )
}
