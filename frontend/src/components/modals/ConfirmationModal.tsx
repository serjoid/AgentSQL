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
    UPDATE: 'bg-warning/10 border-warning/20 text-warning',
    DELETE: 'bg-error/10 border-error/20 text-error',
    DROP: 'bg-error/10 border-error/20 text-error',
    ALTER: 'bg-warning/10 border-warning/20 text-warning',
    TRUNCATE: 'bg-error/10 border-error/20 text-error',
    INSERT: 'bg-info/10 border-info/20 text-info',
  }

  const operationLabels: Record<string, string> = {
    UPDATE: 'Update',
    DELETE: 'Delete',
    DROP: 'Drop Table',
    ALTER: 'Alter Table',
    TRUNCATE: 'Truncate Table',
    INSERT: 'Insert',
  }

  const colorClass = operationType ? operationColors[operationType] || 'bg-bg-hover border-border-medium text-text-secondary' : ''
  const label = operationType ? operationLabels[operationType] || operationType : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-bg-surface border border-border-medium rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle bg-bg-elevated">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Confirm Destructive Operation
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary">Operation:</span>
            <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${colorClass}`}>
              {label}
            </span>
          </div>

          <div>
            <span className="text-xs text-text-secondary block mb-2">
              Affected Tables:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tablesAffected.length > 0 ? (
                tablesAffected.map((table) => (
                  <span
                    key={table}
                    className="px-2 py-1 bg-bg-elevated border border-border-subtle rounded-md text-xs text-text-primary font-mono"
                  >
                    {table}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-muted italic">
                  Unknown (could not determine from query)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs text-text-secondary block mb-2">
              Query:
            </span>
            <pre className="bg-bg-deep border border-border-subtle rounded-lg p-3 overflow-x-auto">
              <code className="text-xs text-text-primary font-mono whitespace-pre-wrap break-all">
                {query}
              </code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border-subtle bg-bg-elevated flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-bg-surface hover:bg-bg-hover border border-border-medium text-text-primary text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-4 py-2 bg-error/15 hover:bg-error/25 text-error text-sm font-medium rounded-lg border border-error/20 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Execute Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
