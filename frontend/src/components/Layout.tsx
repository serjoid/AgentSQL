import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Editor from './Editor'
import AIPanel from './AIPanel'
import { ConfirmationModal, ConnectionModal } from './modals'
import { useModalStore, useConnectionStore, useQueryStore } from '../stores'
import { api } from '../services/api'

export default function Layout() {
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [aiPanelWidth, setAiPanelWidth] = useState(350)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  
  const { 
    showConfirmation, 
    pendingQuery, 
    operationType, 
    tablesAffected, 
    closeConfirmation,
    showConnectionModal,
    closeConnectionModal 
  } = useModalStore()
  
  const { addConnection, setActiveConnection } = useConnectionStore()
  const { setCurrentQuery } = useQueryStore()

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
    <div className="flex h-full w-full bg-bg-primary">
      <Sidebar width={sidebarWidth} />

      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          marginLeft: sidebarWidth,
          marginRight: aiPanelOpen ? aiPanelWidth : 0,
        }}
      >
        <Editor />
      </main>

      {aiPanelOpen && (
        <AIPanel width={aiPanelWidth} onClose={() => setAiPanelOpen(false)} />
      )}

      {!aiPanelOpen && (
        <button
          onClick={() => setAiPanelOpen(true)}
          className="fixed right-4 bottom-4 bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-lg shadow-lg transition-colors z-40"
        >
          Open AI Assistant
        </button>
      )}

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
