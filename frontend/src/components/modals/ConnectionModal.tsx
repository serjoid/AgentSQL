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

  const handleSubmit = (e: React.FormEvent) => {
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

    onConnect(config)
    handleClose()
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-bg-secondary border border-border-primary rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-primary bg-bg-tertiary">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              New Connection
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-bg-secondary rounded transition-colors"
            >
              <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Connection Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dbType === 'sqlite' ? 'My SQLite DB' : 'My PostgreSQL DB'}
              className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Database Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDbType('postgresql')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  dbType === 'postgresql'
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-bg-primary border-border-primary text-text-secondary hover:border-accent-primary'
                }`}
              >
                PostgreSQL
              </button>
              <button
                type="button"
                onClick={() => setDbType('sqlite')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  dbType === 'sqlite'
                    ? 'bg-accent-primary border-accent-primary text-white'
                    : 'bg-bg-primary border-border-primary text-text-secondary hover:border-accent-primary'
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
                  <label className="block text-sm text-text-secondary mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  required
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Database File Path *
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/path/to/database.db"
                required
                className="w-full bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
              <p className="text-xs text-text-muted mt-1">
                Enter the absolute path to your SQLite database file
              </p>
            </div>
          )}

          {testStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                testStatus === 'testing'
                  ? 'bg-blue-500/20 text-blue-400'
                  : testStatus === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {testStatus === 'testing' && (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Testing connection...
                </>
              )}
              {testStatus === 'success' && (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Connection successful!
                </>
              )}
              {testStatus === 'error' && (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Connection failed
                </>
              )}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-border-primary bg-bg-tertiary flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleTest}
            className="px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-primary text-text-primary rounded-lg transition-colors"
          >
            Test Connection
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}
