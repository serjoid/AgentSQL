import { useRef, useCallback } from 'react'

interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
  disabled?: boolean
}

export default function SQLEditor({ value, onChange, onExecute, disabled }: SQLEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const lines = value.split('\n')
  const lineCount = lines.length

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onExecute?.()
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        const start = e.currentTarget.selectionStart
        const end = e.currentTarget.selectionEnd
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2
        }, 0)
      }
    },
    [value, onChange, onExecute]
  )

  const getHighlightTokens = (code: string) => {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
      'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL',
      'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
      'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
      'TRUNCATE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET',
      'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'CASE',
      'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'COALESCE', 'NULLIF',
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'EXISTS', 'ASC', 'DESC',
    ]

    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'gi')
      highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>')
    })

    highlighted = highlighted
      .replace(/'([^']*)'/g, '<span class="text-green-400">\'$1\'</span>')
      .replace(/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')
      .replace(/(--[^\n]*)/g, '<span class="text-gray-500 italic">$1</span>')

    return highlighted
  }

  return (
    <div className="relative flex-1 flex font-mono text-sm bg-bg-primary overflow-hidden">
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 py-4 pr-2 pl-4 text-right text-text-muted select-none overflow-hidden border-r border-border-secondary"
        style={{ minWidth: '50px' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className="leading-6 h-6">
            {i + 1}
          </div>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <pre
          className="absolute inset-0 py-4 px-4 pointer-events-none whitespace-pre overflow-hidden"
          aria-hidden="true"
        >
          <code
            className="text-text-primary"
            dangerouslySetInnerHTML={{ __html: getHighlightTokens(value) }}
          />
        </pre>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          disabled={disabled}
          spellCheck={false}
          className="absolute inset-0 w-full h-full py-4 px-4 bg-transparent text-transparent caret-white resize-none focus:outline-none font-mono leading-6"
          style={{ caretColor: 'white' }}
        />
      </div>
    </div>
  )
}
