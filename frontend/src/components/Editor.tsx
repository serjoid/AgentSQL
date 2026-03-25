import { useState, useCallback } from 'react'
import SQLEditor from './SQLEditor'
import { useQueryStore, useModalStore, useConnectionStore } from '../stores'
import { api } from '../services/api'

export default function Editor() {
  const { currentQuery, setCurrentQuery, setResults, isExecuting, setIsExecuting } = useQueryStore()
  const { openConfirmation } = useModalStore()
  const { activeConnectionId } = useConnectionStore()
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  const handleExecute = useCallback(async () => {
    if (!currentQuery.trim()) return
    if (!activeConnectionId) {
      setError('No database connection selected')
      return
    }

    setError(null)
    setIsExecuting(true)
    const startTime = performance.now()

    try {
      const validation = await api.query.validate(currentQuery)

      if (validation.is_destructive) {
        openConfirmation(
          currentQuery,
          validation.operation_type || 'Unknown',
          validation.tables_affected
        )
        setIsExecuting(false)
        return
      }

      const result = await api.query.execute(activeConnectionId, currentQuery, false)
      setExecutionTime(Math.round(performance.now() - startTime))
      setResults({
        columns: result.columns,
        rows: result.rows,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }, [currentQuery, activeConnectionId, setResults, setIsExecuting, openConfirmation])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-deep">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col border-b border-border-subtle min-h-[40%]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 h-9 bg-bg-elevated border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-text-primary">
              <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="font-medium">SQL Script</span>
            </div>
            <span className="text-[10px] text-text-muted">
              Press <kbd className="bg-bg-input border border-border-medium px-1 py-0.5 rounded mx-0.5 font-mono text-[9px]">Ctrl</kbd> + <kbd className="bg-bg-input border border-border-medium px-1 py-0.5 rounded mx-0.5 font-mono text-[9px]">Enter</kbd> to run
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExecute}
              disabled={isExecuting || !currentQuery.trim() || !activeConnectionId}
              className="h-7 flex items-center gap-1.5 px-3 bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan text-xs font-medium rounded-md transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed border border-accent-cyan/20"
              title="Execute Query (Ctrl+Enter)"
            >
              {isExecuting ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
              Execute
            </button>
          </div>
        </div>

        {/* SQL Editor */}
        <div className="flex-1 min-h-0 bg-bg-deep">
          <SQLEditor
            value={currentQuery}
            onChange={setCurrentQuery}
            onExecute={handleExecute}
            disabled={isExecuting}
          />
        </div>
      </div>

      {/* Error Bar */}
      {error && (
        <div className="px-3 py-1.5 bg-error/10 border-b border-error/20 text-error text-xs flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-error/70 hover:text-error p-0.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Results Section */}
      <div className="flex-1 flex flex-col overflow-hidden bg-bg-deep min-h-0">
        <ResultsGrid executionTime={executionTime} />
      </div>
    </div>
  )
}

function ResultsGrid({ executionTime }: { executionTime: number | null }) {
  const { results } = useQueryStore()

  if (!results) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted bg-bg-deep">
        <div className="text-center">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <p className="text-xs">No active execution</p>
        </div>
      </div>
    )
  }

  const hasData = results.columns.length > 0 && results.rows.length >= 0

  return (
    <div className="flex flex-col h-full">
      {/* Results Header */}
      <div className="flex items-center justify-between px-3 h-8 bg-bg-elevated border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-text-primary">
          <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">Results Grid</span>
        </div>
        <span className="text-[10px] text-text-muted">
          {results.rows.length} row{results.rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {hasData ? (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-bg-elevated">
                <th className="w-10 px-2.5 py-1.5 border-r border-b border-border-subtle text-text-muted text-center font-normal text-[10px] select-none">
                  #
                </th>
                {results.columns.map((col) => (
                  <th
                    key={col}
                    className="px-2.5 py-1.5 text-left text-text-primary font-medium border-r border-b border-border-subtle whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row, i) => (
                <tr key={i} className="hover:bg-bg-hover transition-colors group">
                  <td className="w-10 px-2.5 py-1 border-r border-b border-border-subtle text-text-muted text-center text-[10px] select-none bg-bg-surface/30">
                    {i + 1}
                  </td>
                  {results.columns.map((col) => {
                    const val = row[col]
                    const isNull = val === null
                    return (
                      <td
                        key={col}
                        className={`px-2.5 py-1 border-r border-b border-border-subtle whitespace-nowrap font-mono ${
                          isNull ? 'text-text-muted/50 italic' : 'text-text-secondary group-hover:text-text-primary'
                        }`}
                      >
                        {isNull ? 'NULL' : String(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-text-muted">
            Query executed successfully.
          </div>
        )}
      </div>

      {/* Results Footer */}
      <div className="flex items-center justify-between px-3 h-6 bg-bg-surface border-t border-border-subtle shrink-0 text-[10px] text-text-muted">
        <span>
          rows: {results.rows.length} of {results.rows.length}
        </span>
        <div className="flex items-center gap-3">
          {executionTime !== null && (
            <span>execution: {executionTime}ms (perf_counter)</span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            HITL (Safe)
          </span>
        </div>
      </div>
    </div>
  )
}
