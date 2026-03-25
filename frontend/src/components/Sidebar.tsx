import { useState, useEffect } from 'react'
import { useConnectionStore, useModalStore } from '../stores'
import type { SchemaTable } from '../types'

interface SidebarProps {
  width: number
}

export default function Sidebar({ width }: SidebarProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const { connections, activeConnectionId, schema, setActiveConnection } = useConnectionStore()
  const { openConnectionModal } = useModalStore()

  useEffect(() => {
    const fetchSchema = async () => {
      if (activeConnectionId) {
        try {
          const { api } = await import('../services/api')
          const schemaData = await api.connection.getSchema(activeConnectionId)
          useConnectionStore.getState().setSchema(schemaData.tables)
        } catch (err) {
          console.log('Could not fetch schema')
        }
      }
    }
    fetchSchema()
  }, [activeConnectionId])

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev)
      if (next.has(tableName)) {
        next.delete(tableName)
      } else {
        next.add(tableName)
      }
      return next
    })
  }

  const tables: SchemaTable[] = schema.length > 0 ? schema : []

  return (
    <div
      className="fixed left-0 top-0 h-full bg-bg-secondary border-r border-border-primary overflow-hidden flex flex-col"
      style={{ width }}
    >
      <div className="p-4 border-b border-border-primary">
        <h1 className="text-lg font-semibold text-text-primary">SGBD</h1>
        <p className="text-xs text-text-muted mt-1">Database Manager</p>
      </div>

      <div className="p-3 border-b border-border-primary">
        <button
          onClick={openConnectionModal}
          className="w-full flex items-center gap-2 px-3 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-md text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Connection
        </button>
      </div>

      {connections.length > 0 && (
        <div className="p-3 border-b border-border-primary">
          <label className="block text-xs text-text-muted mb-1">Active Connection</label>
          <select
            value={activeConnectionId || ''}
            onChange={(e) => setActiveConnection(e.target.value || null)}
            className="w-full bg-bg-primary border border-border-primary rounded px-2 py-1.5 text-sm text-text-primary"
          >
            <option value="">Select connection</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.db_type})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Tables
          </h2>

          {tables.length === 0 ? (
            <div className="text-xs text-text-muted py-4 text-center">
              {activeConnectionId ? 'No tables found' : 'Connect to a database'}
            </div>
          ) : (
            <ul className="space-y-1">
              {tables.map((table) => (
                <li key={table.name}>
                  <button
                    onClick={() => toggleTable(table.name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedTables.has(table.name) ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {table.name}
                  </button>

                  {expandedTables.has(table.name) && table.columns && (
                    <ul className="ml-8 mt-1 space-y-0.5">
                      {table.columns.map((col) => (
                        <li key={col.name}>
                          <span className="flex items-center gap-2 px-2 py-1 text-xs text-text-muted">
                            {col.primary_key ? (
                              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                              </svg>
                            ) : (
                              <span className="w-3" />
                            )}
                            <span className="text-text-secondary">{col.name}</span>
                            <span className="text-text-muted">{col.type}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border-primary">
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-muted">
          <span className={`w-2 h-2 rounded-full ${activeConnectionId ? 'bg-green-500' : 'bg-gray-500'}`} />
          {activeConnectionId ? 'Connected' : 'Not connected'}
        </div>
      </div>
    </div>
  )
}
