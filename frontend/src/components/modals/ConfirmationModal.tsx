import { useEffect, useRef } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  operationType: string | null
  tablesAffected: string[]
  query: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmationModal({
  isOpen,
  operationType,
  tablesAffected,
  query,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const operationColors: Record<string, string> = {
    UPDATE: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    DELETE: 'bg-red-500/20 border-red-500 text-red-400',
    DROP: 'bg-red-600/20 border-red-600 text-red-500',
    ALTER: 'bg-orange-500/20 border-orange-500 text-orange-400',
    TRUNCATE: 'bg-red-600/20 border-red-600 text-red-500',
    INSERT: 'bg-blue-500/20 border-blue-500 text-blue-400',
  }

  const operationLabels: Record<string, string> = {
    UPDATE: 'Update',
    DELETE: 'Delete',
    DROP: 'Drop Table',
    ALTER: 'Alter Table',
    TRUNCATE: 'Truncate Table',
    INSERT: 'Insert',
  }

  const colorClass = operationType ? operationColors[operationType] || 'bg-gray-500/20 border-gray-500 text-gray-400' : ''
  const label = operationType ? operationLabels[operationType] || operationType : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-bg-secondary border border-border-primary rounded-lg shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-primary bg-bg-tertiary">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Confirm Destructive Operation
              </h2>
              <p className="text-sm text-text-muted">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Operation:</span>
            <span className={`px-3 py-1 rounded border text-sm font-medium ${colorClass}`}>
              {label}
            </span>
          </div>

          <div>
            <span className="text-sm text-text-secondary block mb-2">
              Affected Tables:
            </span>
            <div className="flex flex-wrap gap-2">
              {tablesAffected.length > 0 ? (
                tablesAffected.map((table) => (
                  <span
                    key={table}
                    className="px-2 py-1 bg-bg-tertiary border border-border-primary rounded text-sm text-text-primary font-mono"
                  >
                    {table}
                  </span>
                ))
              ) : (
                <span className="text-sm text-text-muted italic">
                  Unknown (could not determine from query)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm text-text-secondary block mb-2">
              Query:
            </span>
            <pre className="bg-bg-primary border border-border-primary rounded p-3 overflow-x-auto">
              <code className="text-sm text-text-primary font-mono whitespace-pre-wrap break-all">
                {query}
              </code>
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-primary bg-bg-tertiary flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-primary text-text-primary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Execute Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
