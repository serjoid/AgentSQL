import { useState } from 'react'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (config: ConnectionConfig) => void
}

interface ConnectionConfig {
  name: string
  db_type: 'postgresql' | 'sqlite'
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  path?: string
}

export default function ConnectionModal({ isOpen, onClose, onConnect }: ConnectionModalProps) {
  const [dbType, setDbType] = useState<'postgresql' | 'sqlite'>('postgresql')
  const [name, setName] = useState('')
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState('5432')
  const [database, setDatabase] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [path, setPath] = useState('')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testErrorMsg, setTestErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()

    const config: ConnectionConfig = {
      name: name || (dbType === 'sqlite' ? 'SQLite Connection' : 'PostgreSQL Connection'),
      db_type: dbType,
      database,
    }

    if (dbType === 'postgresql') {
      config.host = host
      config.port = parseInt(port) || 5432
      config.username = username
      config.password = password
    } else {
      config.path = path
    }

    try {
      setTestStatus('testing')
      setTestErrorMsg('')
      await onConnect(config)
      setTestStatus('success')
      // Small delay so user sees success before modal closes
      setTimeout(() => {
        handleClose()
      }, 500)
    } catch (error: any) {
      console.error(error)
      setTestStatus('error')
      setTestErrorMsg(error.message || 'Unknown error occurred')
    }
  }

  const handleClose = () => {
    setName('')
    setHost('localhost')
    setPort('5432')
    setDatabase('')
    setUsername('')
    setPassword('')
    setPath('')
    setTestStatus('idle')
    setTestErrorMsg('')
    onClose()
  }

  const handleTest = async () => {
    setTestStatus('testing')
    await new Promise((r) => setTimeout(r, 1500))
    setTestStatus('success')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-bg-surface border border-border-medium rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle bg-bg-elevated">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent-cyan-dim flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-text-primary">New Connection</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
              Connection Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dbType === 'sqlite' ? 'My SQLite DB' : 'My PostgreSQL DB'}
              className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent-cyan transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
              Database Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDbType('postgresql')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                  dbType === 'postgresql'
                    ? 'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan'
                    : 'bg-bg-input border-border-medium text-text-secondary hover:border-accent-cyan/30'
                }`}
              >
                PostgreSQL
              </button>
              <button
                type="button"
                onClick={() => setDbType('sqlite')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                  dbType === 'sqlite'
                    ? 'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan'
                    : 'bg-bg-input border-border-medium text-text-secondary hover:border-accent-cyan/30'
                }`}
              >
                SQLite
              </button>
            </div>
          </div>

          {dbType === 'postgresql' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Database Name *</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  required
                  className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Database File Path *</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/database.db"
                required
                className="w-full bg-bg-input border border-border-medium rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent-cyan transition-colors"
              />
              <p className="text-[10px] text-text-muted mt-1">
                Enter the absolute path to your SQLite database file
              </p>
            </div>
          )}

          {testStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                testStatus === 'testing'
                  ? 'bg-info/10 text-info border border-info/15'
                  : testStatus === 'success'
                  ? 'bg-success/10 text-success border border-success/15'
                  : 'bg-error/10 text-error border border-error/15'
              }`}
            >
              {testStatus === 'testing' && (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing connection...
                </>
              )}
              {testStatus === 'success' && (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Connection successful!
                </>
              )}
              {testStatus === 'error' && (
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2 font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Connection failed</span>
                  </div>
                  {testErrorMsg && (
                    <div className="text-[10px] opacity-80 pl-5 leading-relaxed break-all font-mono">
                      {testErrorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border-subtle bg-bg-elevated flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleTest}
            className="px-4 py-2 bg-bg-surface hover:bg-bg-hover border border-border-medium text-text-primary text-sm rounded-lg transition-colors"
          >
            Test Connection
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan text-sm font-medium rounded-lg border border-accent-cyan/20 transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}
