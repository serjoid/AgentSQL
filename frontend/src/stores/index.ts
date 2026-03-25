import { create } from 'zustand'
import type { Connection, SchemaTable, AIProvider, AIChatMessage } from '../types'

interface ConnectionState {
  connections: Connection[]
  activeConnectionId: string | null
  schema: SchemaTable[]
  setConnections: (connections: Connection[]) => void
  addConnection: (connection: Connection) => void
  removeConnection: (id: string) => void
  setActiveConnection: (id: string | null) => void
  setSchema: (schema: SchemaTable[]) => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connections: [],
  activeConnectionId: null,
  schema: [],
  setConnections: (connections) => set({ connections }),
  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection],
      activeConnectionId: connection.id,
    })),
  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
      activeConnectionId:
        state.activeConnectionId === id ? null : state.activeConnectionId,
    })),
  setActiveConnection: (id) => set({ activeConnectionId: id }),
  setSchema: (schema) => set({ schema }),
}))

interface QueryState {
  currentQuery: string
  queryHistory: string[]
  results: {
    columns: string[]
    rows: Record<string, unknown>[]
  } | null
  isExecuting: boolean
  setCurrentQuery: (query: string) => void
  addToHistory: (query: string) => void
  setResults: (results: { columns: string[]; rows: Record<string, unknown>[] } | null) => void
  setIsExecuting: (isExecuting: boolean) => void
}

export const useQueryStore = create<QueryState>((set) => ({
  currentQuery: '',
  queryHistory: [],
  results: null,
  isExecuting: false,
  setCurrentQuery: (query) => set({ currentQuery: query }),
  addToHistory: (query) =>
    set((state) => ({
      queryHistory: [query, ...state.queryHistory].slice(0, 50),
    })),
  setResults: (results) => set({ results }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
}))

interface AIPanelState {
  messages: AIChatMessage[]
  provider: string
  model: string
  providers: AIProvider[]
  isLoading: boolean
  addMessage: (message: AIChatMessage) => void
  setProvider: (provider: string) => void
  setModel: (model: string) => void
  setProviders: (providers: AIProvider[]) => void
  setIsLoading: (isLoading: boolean) => void
  clearMessages: () => void
}

export const useAIStore = create<AIPanelState>((set) => ({
  messages: [],
  provider: 'openai',
  model: 'gpt-4o-mini',
  providers: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setProvider: (provider) => set({ provider }),
  setModel: (model) => set({ model }),
  setProviders: (providers) => set({ providers }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}))

interface ModalState {
  showConfirmation: boolean
  pendingQuery: string | null
  operationType: string | null
  tablesAffected: string[]
  showConnectionModal: boolean
  openConfirmation: (query: string, operationType: string, tables: string[]) => void
  closeConfirmation: () => void
  openConnectionModal: () => void
  closeConnectionModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  showConfirmation: false,
  pendingQuery: null,
  operationType: null,
  tablesAffected: [],
  showConnectionModal: false,
  openConfirmation: (query, operationType, tables) =>
    set({
      showConfirmation: true,
      pendingQuery: query,
      operationType,
      tablesAffected: tables,
    }),
  closeConfirmation: () =>
    set({
      showConfirmation: false,
      pendingQuery: null,
      operationType: null,
      tablesAffected: [],
    }),
  openConnectionModal: () => set({ showConnectionModal: true }),
  closeConnectionModal: () => set({ showConnectionModal: false }),
}))
