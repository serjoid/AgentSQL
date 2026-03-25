import { useState, useCallback } from 'react'
import SQLEditor from './SQLEditor'
import { useQueryStore, useModalStore, useConnectionStore } from '../stores'
import { api } from '../services/api'

export default function Editor() {
  const { currentQuery, setCurrentQuery, setResults, isExecuting, setIsExecuting } = useQueryStore()
  const { openConfirmation, closeConfirmation } = useModalStore()
  const { activeConnectionId } = useConnectionStore()
  const [error, setError] = useState<string | null>(null)

  const handleExecute = useCallback(async () => {
    if (!currentQuery.trim()) return
    if (!activeConnectionId) {
      setError('No database connection selected')
      return
    }

    setError(null)
    setIsExecuting(true)

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
      setResults({
        columns: result.columns,
        rows: result.rows,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }, [currentQuery, activeConnectionId, setCurrentQuery, setResults, setIsExecuting, openConfirmation])

  const executeConfirmedQuery = async () => {
    if (!activeConnectionId || !currentQuery) return

    setIsExecuting(true)
    closeConfirmation()

    try {
      const result = await api.query.execute(activeConnectionId, currentQuery, true)
      setResults({
        columns: result.columns,
        rows: result.rows,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col border-b border-border-primary min-h-0">
        <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-primary">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">SQL Editor</span>
            <span className="text-xs text-text-muted">
              Ctrl+Enter to run
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={isExecuting || !currentQuery.trim() || !activeConnectionId}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Run Query
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <SQLEditor
            value={currentQuery}
            onChange={setCurrentQuery}
            onExecute={handleExecute}
            disabled={isExecuting}
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/20 border-b border-red-500 text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-bg-secondary min-h-0">
        <ResultsGrid />
      </div>
    </div>
  )
}

function ResultsGrid() {
  const { results } = useQueryStore()

  if (!results) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <p>No results yet</p>
          <p className="text-xs mt-1">Execute a query to see results</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-2 border-b border-border-primary flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          Results
        </span>
        <span className="text-xs text-text-muted">
          {results.rows.length} rows
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-tertiary sticky top-0 z-10">
            <tr>
              {results.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-text-secondary font-medium border-b border-border-primary whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.rows.map((row, i) => (
              <tr key={i} className="hover:bg-bg-tertiary transition-colors">
                {results.columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-text-primary border-b border-border-secondary whitespace-nowrap"
                  >
                    {row[col] === null ? (
                      <span className="text-text-muted italic">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
