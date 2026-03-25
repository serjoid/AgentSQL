const API_BASE = 'http://localhost:8000/api'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || 'Request failed')
  }

  return response.json()
}

export const api = {
  connection: {
    connect: async (data: {
      name: string
      db_type: 'postgresql' | 'sqlite'
      host?: string
      port?: number
      database: string
      username?: string
      password?: string
      path?: string
    }) => {
      return fetchApi<import('../types').Connection>('/connection/connect', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    list: () => fetchApi<import('../types').Connection[]>('/connection/list'),

    disconnect: (id: string) =>
      fetchApi<{ success: boolean }>(`/connection/${id}`, { method: 'DELETE' }),

    getSchema: (id: string) =>
      fetchApi<{ connection_id: string; tables: import('../types').SchemaTable[]; views: string[] }>(
        `/connection/${id}/schema`
      ),
  },

  query: {
    validate: async (query: string) => {
      return fetchApi<import('../types').QueryValidation>('/query/validate', {
        method: 'POST',
        body: JSON.stringify({ query }),
      })
    },

    execute: async (connectionId: string, query: string, skipConfirmation = false) => {
      return fetchApi<import('../types').QueryResult>('/query/execute', {
        method: 'POST',
        body: JSON.stringify({
          connection_id: connectionId,
          query,
          skip_confirmation: skipConfirmation,
        }),
      })
    },
  },

  ai: {
    getProviders: () => fetchApi<import('../types').AIProvider[]>('/ai/providers'),

    configure: (provider: string, apiKey: string) =>
      fetchApi<{ success: boolean; message: string }>('/ai/config', {
        method: 'POST',
        body: JSON.stringify({ provider, api_key: apiKey }),
      }),

    chat: async (provider: string, model: string, message: string, includeSchema = true) => {
      return fetchApi<{ response: string; timestamp: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          model,
          message,
          include_schema: includeSchema,
        }),
      })
    },

    suggest: async (provider: string, model: string, prompt: string) => {
      return fetchApi<{ response: string }>('/ai/suggest', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          model,
          prompt,
          connection_id: '',
        }),
      })
    },
  },
}
