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
        if (!provider && data.length > 0) {
          setProvider(data[0].provider)
        }
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

  const currentProvider = providers.find((p) => p.provider === provider)
  const isConfigured = currentProvider?.is_configured ?? false
  const displaySettings = showSettings || (providers.length > 0 && !isConfigured)

  return (
    <div
      className="flex flex-col h-full bg-bg-surface border-l border-border-subtle"
      style={{ width, minWidth: width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pl-3 pr-5 h-9 border-b border-border-subtle bg-bg-elevated shrink-0">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[11px] font-semibold text-text-secondary tracking-wider uppercase">Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              displaySettings ? 'bg-accent-cyan-dim text-accent-cyan' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
            title="Settings"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Close Panel"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {displaySettings && (
        <div className="pl-3 pr-5 py-3 border-b border-border-subtle bg-bg-surface space-y-3 shrink-0">
          <div>
            <label className="block text-[10px] font-semibold uppercase text-text-muted tracking-wider mb-1.5">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-bg-input border border-border-medium rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors appearance-none cursor-pointer"
            >
              {providers.map((p) => (
                <option key={p.provider} value={p.provider}>
                  {p.provider} {p.is_configured ? '\u2713' : ''}
                </option>
              ))}
            </select>
          </div>

          {isConfigured && (
            <div>
              <label className="block text-[10px] font-semibold uppercase text-text-muted tracking-wider mb-1.5">Model</label>
              <div className="relative">
                <input
                  type="text"
                  list="model-suggestions"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Select or type model..."
                  className="w-full bg-bg-input border border-border-medium rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                />
                <datalist id="model-suggestions">
                  {currentProvider?.models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {!isConfigured ? (
            <div>
              <label className="block text-[10px] font-semibold uppercase text-text-muted tracking-wider mb-1.5">API Key</label>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter ${provider} API key`}
                  className="flex-1 bg-bg-input border border-border-medium rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent-cyan transition-colors"
                />
                <button
                  onClick={handleConfigure}
                  disabled={!apiKey.trim()}
                  className="px-3 py-1.5 bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan text-xs font-medium rounded-md border border-accent-cyan/20 disabled:opacity-30 transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-1">Stored in memory only</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-success bg-success/10 px-2.5 py-1.5 rounded-md border border-success/15">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              API Key Configured
            </div>
          )}

          <button
            onClick={clearMessages}
            className="w-full text-[11px] text-text-muted hover:text-error py-1.5 border border-border-subtle hover:border-error/30 rounded-md transition-colors"
          >
            Clear Conversation
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pl-3 pr-5 py-3 space-y-3 bg-bg-deep">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <svg className="w-10 h-10 text-text-muted/15 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-xs text-text-muted leading-relaxed">
              Pergunte sobre SQL, esquemas, ou peca analises...
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-accent-purple-dim flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent-purple text-[9px] font-bold">AI</span>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-cyan/15 text-text-primary border border-accent-cyan/15'
                    : 'bg-bg-surface text-text-primary border border-border-subtle'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-bg-hover flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-accent-purple-dim flex items-center justify-center shrink-0">
              <span className="text-accent-purple text-[9px] font-bold">AI</span>
            </div>
            <div className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pl-2.5 pr-4 py-2.5 border-t border-border-subtle bg-bg-surface shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={isConfigured ? 'Pergunte sobre SQL, esquemas, ou peca analises...' : 'Configure API key first...'}
            className="flex-1 bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent-cyan transition-colors resize-none h-[56px]"
            disabled={isLoading || !isConfigured}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !isConfigured}
            className="w-9 h-9 self-end flex items-center justify-center bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-accent-cyan/20"
            title="Send"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
