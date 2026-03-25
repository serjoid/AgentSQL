export interface Connection {
  id: string
  name: string
  db_type: string
  database: string
  connected: boolean
  connected_at: string | null
}

export interface SchemaTable {
  name: string
  columns: SchemaColumn[]
}

export interface SchemaColumn {
  name: string
  type: string
  nullable: boolean
  default: string | null
  primary_key: boolean
}

export interface QueryValidation {
  is_destructive: boolean
  operation_type: string | null
  tables_affected: string[]
  requires_confirmation: boolean
  normalized_query: string
}

export interface QueryResult {
  success: boolean
  columns: string[]
  rows: Record<string, unknown>[]
  row_count: number
  execution_time_ms: number
  message: string | null
}

export interface AIProvider {
  provider: string
  models: string[]
  is_configured: boolean
}

export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
