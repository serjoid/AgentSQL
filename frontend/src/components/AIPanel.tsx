import { useState, useRef, useEffect, useCallback } from 'react'
import { useAIStore, useConnectionStore } from '../stores'
import { api } from '../services/api'

interface AIPanelProps {
  width: number
  onClose: () => void
}

export default function AIPanel({ width, onClose }: AIPanelProps) {
  const {
    messages,
    provider,
    model,
    providers,
    isLoading,
    addMessage,
    setProvider,
    setModel,
    setProviders,
    setIsLoading,
    clearMessages,
  } = useAIStore()

  const { activeConnectionId } = useConnectionStore()
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await api.ai.getProviders()
        setProviders(data)
      } catch (err) {
        console.log('Could not load providers')
      }
    }
    loadProviders()
  }, [setProviders])

  const handleConfigure = async () => {
    if (!apiKey.trim()) return
    try {
      await api.ai.configure(provider, apiKey)
      setApiKey('')
      const data = await api.ai.getProviders()
      setProviders(data)
    } catch (err) {
      console.error('Failed to configure provider:', err)
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
    }

    addMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.ai.chat(provider, model, input, !!activeConnectionId)
      
      addMessage({
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      })
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, provider, model, activeConnectionId, addMessage, setIsLoading])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentProvider = providers.find((p) => p.provider === provider)
  const isConfigured = currentProvider?.is_configured ?? false

  return (
    <div
      className="fixed right-0 top-0 h-full bg-bg-secondary border-l border-border-primary flex flex-col"
      style={{ width }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-text-primary">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="px-4 py-3 border-b border-border-primary bg-bg-tertiary space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              {providers.map((p) => (
                <option key={p.provider} value={p.provider}>
                  {p.provider} {p.is_configured ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-bg-primary border border-border-primary rounded px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              {currentProvider?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {!isConfigured && (
            <div>
              <label className="block text-xs text-text-muted mb-1">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter ${provider} API key`}
                  className="flex-1 bg-bg-primary border border-border-primary rounded px-2 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
                <button
                  onClick={handleConfigure}
                  disabled={!apiKey.trim()}
                  className="px-3 py-1.5 bg-accent-primary hover:bg-accent-secondary text-white text-sm rounded disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {isConfigured && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              API key configured
            </div>
          )}

          <button
            onClick={clearMessages}
            className="w-full text-xs text-text-muted hover:text-text-secondary py-1"
          >
            Clear conversation
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-primary'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-bg-tertiary rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border-primary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConfigured ? 'Ask about your data...' : 'Configure API key first...'}
            className="flex-1 bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
            disabled={isLoading || !isConfigured}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !isConfigured}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
