import { useState, useEffect } from 'react'
import { useConnectionStore, useModalStore } from '../stores'
import type { SchemaTable } from '../types'

interface SidebarProps {
  width: number
}

function TypeBadge({ type }: { type: string }) {
  const normalized = type.toLowerCase()
  let color = 'text-text-muted'
  if (normalized.includes('int') || normalized.includes('serial')) color = 'text-blue-400'
  else if (normalized.includes('text') || normalized.includes('varchar') || normalized.includes('char')) color = 'text-emerald-400'
  else if (normalized.includes('numeric') || normalized.includes('decimal') || normalized.includes('float') || normalized.includes('double')) color = 'text-amber-400'
  else if (normalized.includes('bool')) color = 'text-pink-400'
  else if (normalized.includes('date') || normalized.includes('time') || normalized.includes('timestamp')) color = 'text-purple-400'
  else if (normalized.includes('json')) color = 'text-orange-400'

  return (
    <span className={`text-[10px] ${color} opacity-70 ml-auto shrink-0`}>
      {type}
    </span>
  )
}

export default function Sidebar({ width }: SidebarProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tables']))
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
      if (next.has(tableName)) next.delete(tableName)
      else next.add(tableName)
      return next
    })
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const tables: SchemaTable[] = schema.length > 0 ? schema : []
  const activeConn = connections.find(c => c.id === activeConnectionId)

  return (
    <div
      className="flex flex-col h-full bg-bg-surface border-r border-border-subtle select-none overflow-hidden"
      style={{ width, minWidth: width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-border-subtle bg-bg-elevated shrink-0">
        <span className="text-[11px] font-semibold text-text-secondary tracking-wider uppercase">Explorer</span>
        <button
          onClick={openConnectionModal}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-accent-cyan hover:bg-accent-cyan-dim transition-colors"
          title="New Connection"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Connection Selector */}
      <div className="px-2 py-2 border-b border-border-subtle shrink-0">
        <select
          value={activeConnectionId || ''}
          onChange={(e) => setActiveConnection(e.target.value || null)}
          className="w-full bg-bg-input border border-border-medium rounded-md px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent-cyan transition-colors appearance-none cursor-pointer"
        >
          <option value="">No connection selected</option>
          {connections.map((conn) => (
            <option key={conn.id} value={conn.id}>
              {conn.name} ({conn.db_type})
            </option>
          ))}
        </select>
      </div>

      {/* Active connection indicator */}
      {activeConn && (
        <div className="px-3 py-1.5 border-b border-border-subtle flex items-center gap-2 shrink-0">
          <svg className="w-3.5 h-3.5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span className="text-[11px] font-medium text-text-primary truncate">{activeConn.name}</span>
          <span className="text-[10px] text-text-muted">({activeConn.db_type})</span>
        </div>
      )}

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {tables.length === 0 ? (
          <div className="text-[11px] text-text-muted py-6 px-3 text-center">
            {activeConnectionId ? 'No tables found' : 'Connect to a database to see tables'}
          </div>
        ) : (
          <>
            {/* Tables Section */}
            <div>
              <button
                onClick={() => toggleSection('tables')}
                className="w-full flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hover:bg-bg-hover transition-colors"
              >
                <svg
                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${expandedSections.has('tables') ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-3.5 h-3.5 shrink-0 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Tables
                <span className="text-text-muted font-normal ml-auto">{tables.length}</span>
              </button>

              {expandedSections.has('tables') && (
                <ul className="mt-0.5">
                  {tables.map((table) => (
                    <li key={table.name}>
                      <button
                        onClick={() => toggleTable(table.name)}
                        className="w-full flex items-center gap-1 px-2 py-[3px] text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors group"
                        style={{ paddingLeft: '24px' }}
                      >
                        <svg
                          className={`w-3 h-3 shrink-0 transition-transform duration-150 ${expandedTables.has(table.name) ? 'rotate-90 text-text-primary' : 'text-text-muted'}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <svg className="w-3.5 h-3.5 shrink-0 text-accent-purple opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16M10 10v10" />
                        </svg>
                        <span className="truncate">{table.name}</span>
                      </button>

                      {expandedTables.has(table.name) && table.columns && (
                        <ul className="mb-0.5">
                          {table.columns.map((col) => (
                            <li
                              key={col.name}
                              className="flex items-center gap-1.5 py-[2px] text-xs hover:bg-bg-hover transition-colors"
                              style={{ paddingLeft: '52px', paddingRight: '8px' }}
                            >
                              {col.primary_key ? (
                                <svg className="w-3 h-3 shrink-0 text-warning" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M7 17a5.007 5.007 0 004.898-4H14v2h2v-2h2v-2h-6.102A5.007 5.007 0 007 7a5 5 0 000 10zm0-8a3 3 0 110 6 3 3 0 010-6z" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 shrink-0 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                              )}
                              <span className={`truncate ${col.primary_key ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                                {col.name}
                              </span>
                              <TypeBadge type={col.type} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Views Section */}
            <div className="mt-1">
              <button
                onClick={() => toggleSection('views')}
                className="w-full flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hover:bg-bg-hover transition-colors"
              >
                <svg
                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${expandedSections.has('views') ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-3.5 h-3.5 shrink-0 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Views
              </button>
            </div>

            {/* Functions Section */}
            <div className="mt-1">
              <button
                onClick={() => toggleSection('functions')}
                className="w-full flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hover:bg-bg-hover transition-colors"
              >
                <svg
                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${expandedSections.has('functions') ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-3.5 h-3.5 shrink-0 text-pink-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Functions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
