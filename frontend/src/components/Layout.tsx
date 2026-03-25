import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Editor from './Editor'
import AIPanel from './AIPanel'
import { ConfirmationModal, ConnectionModal } from './modals'
import { useModalStore, useConnectionStore, useQueryStore } from '../stores'
import { api } from '../services/api'

const ICON_STRIP_WIDTH = 48
const SIDEBAR_WIDTH = 232
const AI_PANEL_WIDTH = 350

function IconStrip({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const items = [
    { id: 'explorer', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ), label: 'Explorer' },
    { id: 'schemas', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ), label: 'Schemas' },
    { id: 'connections', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ), label: 'Connections' },
  ]

  const bottomItems = [
    { id: 'settings', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ), label: 'Settings' },
    { id: 'user', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ), label: 'User' },
  ]

  return (
    <div className="flex flex-col items-center h-full bg-bg-deep border-r border-border-subtle py-2" style={{ width: ICON_STRIP_WIDTH }}>
      <div className="flex flex-col items-center gap-1 flex-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 ${
              activeTab === item.id
                ? 'bg-accent-cyan-dim text-accent-cyan'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 ${
              activeTab === item.id
                ? 'bg-accent-cyan-dim text-accent-cyan'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  )
}

function TitleBar({ aiPanelOpen, onToggleAI }: { aiPanelOpen: boolean; onToggleAI: () => void }) {
  return (
    <div className="flex items-center justify-between h-10 pl-3 pr-5 bg-bg-surface border-b border-border-subtle select-none" data-tauri-drag-region>
      <div className="flex items-center gap-2.5">
        <button className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent-cyan/20 flex items-center justify-center">
            <span className="text-accent-cyan text-[10px] font-bold">A</span>
          </div>
          <span className="text-xs font-medium text-text-primary tracking-wide">AgentSQL</span>
          <span className="text-[10px] text-text-muted hidden sm:inline">— AI-Powered Database Management System</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAI}
          className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs transition-all duration-150 ${
            aiPanelOpen
              ? 'bg-accent-cyan-dim text-accent-cyan'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
          title={aiPanelOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">AI</span>
        </button>
      </div>
    </div>
  )
}

function StatusBar() {
  const { activeConnectionId, connections } = useConnectionStore()
  const activeConn = connections.find(c => c.id === activeConnectionId)

  return (
    <div className="flex items-center justify-between h-6 px-3 bg-bg-surface border-t border-border-subtle text-[11px] select-none">
      <div className="flex items-center gap-3">
        {activeConn ? (
          <span className="text-text-secondary">
            Conexao: <span className="text-text-primary">{activeConn.name}</span>
            <span className="text-text-muted ml-1">({activeConn.db_type})</span>
          </span>
        ) : (
          <span className="text-text-muted">Sem conexao</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${activeConnectionId ? 'bg-success' : 'bg-text-muted'}`} />
          <span className={activeConnectionId ? 'text-success' : 'text-text-muted'}>
            {activeConnectionId ? 'Online' : 'Offline'}
          </span>
        </div>
        <span className="text-text-muted">AgentSQL v0.5.0</span>
      </div>
    </div>
  )
}

export default function Layout() {
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('explorer')

  const {
    showConfirmation,
    pendingQuery,
    operationType,
    tablesAffected,
    closeConfirmation,
    showConnectionModal,
    closeConnectionModal,
  } = useModalStore()

  const { addConnection } = useConnectionStore()

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        await api.ai.getProviders()
      } catch (err) {
        console.log('Backend not running or AI providers unavailable')
      }
    }
    fetchProviders()
  }, [])

  const handleConfirmExecution = async () => {
    const activeConn = useConnectionStore.getState().activeConnectionId
    if (!activeConn || !pendingQuery) {
      closeConfirmation()
      return
    }

    try {
      const result = await api.query.execute(activeConn, pendingQuery, true)
      useQueryStore.getState().setResults({
        columns: result.columns,
        rows: result.rows,
      })
    } catch (err) {
      console.error('Query execution failed:', err)
    } finally {
      closeConfirmation()
    }
  }

  const handleConnect = async (config: Parameters<typeof api.connection.connect>[0]) => {
    try {
      const connection = await api.connection.connect(config)
      addConnection(connection)

      if (connection.connected) {
        const schema = await api.connection.getSchema(connection.id)
        useConnectionStore.getState().setSchema(
          schema.tables.map((t) => ({
            name: t.name,
            columns: t.columns,
          }))
        )
      }
    } catch (err) {
      console.error('Connection failed:', err)
      throw err
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-deep">
      {/* Title Bar */}
      <TitleBar aiPanelOpen={aiPanelOpen} onToggleAI={() => setAiPanelOpen(!aiPanelOpen)} />

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Icon Strip */}
        <IconStrip activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Sidebar */}
        <Sidebar width={SIDEBAR_WIDTH} />

        {/* Editor */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <Editor />
        </main>

        {/* AI Panel */}
        {aiPanelOpen && (
          <AIPanel width={AI_PANEL_WIDTH} onClose={() => setAiPanelOpen(false)} />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmation}
        operationType={operationType}
        tablesAffected={tablesAffected}
        query={pendingQuery || ''}
        onConfirm={handleConfirmExecution}
        onCancel={closeConfirmation}
      />
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={closeConnectionModal}
        onConnect={handleConnect}
      />
    </div>
  )
}
