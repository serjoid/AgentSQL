# AgentSQL — AI-Powered Database Management System
## system_context.md — Referência Técnica Completa

---

## Visão Geral

Desktop app para gerenciamento de bancos de dados com agente AI nativo. O usuário conecta bancos de dados locais ou remotos, executa SQL com segurança HITL e usa sua própria chave de API (OpenAI, Gemini, DeepSeek, etc.) para geração e análise de queries.

---

## Arquitetura

### Fluxo de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TAURI DESKTOP APP                             │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────────────────┐   │
│  │   React    │   │  SQL Editor │   │       AI Agent           │   │
│  │  Frontend  │◄─►│  + Results  │◄─►│      Chat Panel          │   │
│  └─────┬──────┘   └──────┬──────┘   └─────────────┬────────────┘   │
│        └─────────────────┴──────────────────────────┘               │
│                           │  HTTP (localhost:8000)                   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND (FastAPI)                           │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────────────────┐   │
│  │ SQLAlchemy │   │ QueryFilter │   │        LiteLLM           │   │
│  │  + Schema  │◄─►│ (HITL gate) │◄─►│        Router            │   │
│  └────────────┘   └─────────────┘   └──────────────────────────┘   │
└───────────────────┬─────────────────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
  ┌───────────────┐   ┌───────────────┐
  │  PostgreSQL   │   │   LLM APIs    │
  │  SQLite       │   │  OpenAI       │
  └───────────────┘   │  Gemini       │
                      │  DeepSeek     │
                      │  Nvidia NIM   │
                      │  Anthropic    │
                      └───────────────┘
```

### Padrão Sidecar (Produção)

Em **desenvolvimento**: backend e frontend correm em terminais separados.
Em **produção**: PyInstaller empacota o backend em binário que o Tauri inicia automaticamente.

```
backend/scripts/build_sidecar.py
  → frontend/src-tauri/binaries/backend-{triple}.exe   (Windows)
  → frontend/src-tauri/binaries/backend-{triple}       (Linux/macOS)

npm run tauri:build
  → installer único com frontend + shell Rust + sidecar
```

---

## Tech Stack

| Layer             | Tecnologia              | Versão     |
|-------------------|-------------------------|------------|
| Desktop           | Tauri                   | v2         |
| Frontend          | React + TypeScript       | 18 / 5     |
| Estilo            | TailwindCSS             | v4         |
| Backend           | Python + FastAPI        | 3.11+ / 0.109+ |
| ORM               | SQLAlchemy (async)      | 2.0        |
| AI Router         | LiteLLM                 | ≥1.20      |
| SQL Editor        | Monaco Editor           | @4.7       |
| State             | Zustand                 | v5         |
| Desktop Shell     | Rust (tauri-plugin-shell, -dialog) | — |

---

## Regras de Negócio

### HITL (Human-in-the-Loop) — CRÍTICO

Toda query que altera estado **DEVE** passar pelo `QueryFilter` antes de chegar ao banco.
Operações bloqueadas por padrão (requerem confirmação explícita):

- `UPDATE` / `DELETE` / `DROP` / `ALTER` / `TRUNCATE` / `INSERT`

Fluxo:

```
Query do usuário
      │
      ▼
 QueryFilter.analyze()
      │
  ┌───┴───┐
  │       │
  ▼       ▼
Destrutiva?  Segura
  │            │
  ▼            ▼
ConfirmationModal  Execute direto
  │
  ├─ Confirmado → Execute
  └─ Cancelado  → Abort
```

O endpoint `POST /api/query/execute` retorna **HTTP 403** se a query for destrutiva e `skip_confirmation=false`.

### Segurança

- Chaves de API em **memória apenas** — nunca persistidas, limpas ao reiniciar
- Strings de conexão criptografadas com AES-256 (Fernet/PBKDF2)
- Queries executadas via `text()` do SQLAlchemy (nunca concatenação)
- Mensagens de erro sanitizadas em produção

---

## Estrutura de Diretórios (v0.4.0)

```
AgentSQL/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Layout 3 painéis
│   │   │   ├── Sidebar.tsx         # Schema explorer
│   │   │   ├── Editor.tsx          # SQL editor + results grid
│   │   │   ├── AIPanel.tsx         # Chat AI
│   │   │   ├── SQLEditor.tsx       # Monaco + syntax highlight
│   │   │   └── modals/
│   │   │       ├── ConfirmationModal.tsx   # HITL confirm
│   │   │       └── ConnectionModal.tsx     # Nova conexão
│   │   ├── stores/
│   │   │   └── index.ts            # useConnectionStore, useQueryStore,
│   │   │                           # useAIStore, useModalStore (Zustand)
│   │   ├── services/
│   │   │   └── api.ts              # Cliente REST tipado
│   │   └── types/index.ts
│   ├── src-tauri/
│   │   ├── Cargo.toml              # Deps Rust: tauri v2, plugins
│   │   ├── build.rs
│   │   ├── tauri.conf.json         # Janela 1400×900, sidecar backend
│   │   ├── capabilities/default.json   # Permissões Tauri v2
│   │   ├── icons/                  # 32x32, 128x128, 128x128@2x, icon.ico
│   │   └── src/
│   │       ├── main.rs             # Entry point Rust
│   │       └── lib.rs              # setup(), spawn sidecar, DevTools
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, routers
│   │   ├── api/
│   │   │   ├── dependencies.py     # Depends: get_connection, get_engine
│   │   │   └── routes/
│   │   │       ├── connection.py   # /api/connection/*
│   │   │       ├── query.py        # /api/query/* (execução real)
│   │   │       ├── ai.py           # /api/ai/*
│   │   │       └── context.py      # /api/context/* (schema → LLM)
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings
│   │   │   ├── security.py         # Fernet encrypt, InMemoryKeyStore
│   │   │   └── query_filter.py     # HITL — regex + keyword extraction
│   │   ├── db/
│   │   │   ├── connections.py      # ConnectionManager lifecycle
│   │   │   └── metadata.py         # SchemaExtractor — inspeciona DDL
│   │   ├── llm/
│   │   │   ├── router.py           # LiteLLM wrapper
│   │   │   └── context.py          # ContextManager (schema + chat history)
│   │   └── models/
│   │       ├── requests.py
│   │       └── responses.py
│   ├── tests/
│   │   ├── test_query_filter.py    # 11 testes HITL
│   │   ├── test_connections.py     # 8 testes SQLite in-memory
│   │   └── test_routes.py          # 10 testes de rota (FastAPI)
│   ├── scripts/
│   │   └── build_sidecar.py        # PyInstaller → binário Tauri
│   ├── requirements.txt
│   └── pyproject.toml              # pytest asyncio_mode=auto
│
├── system_context.md
└── README.md
```

---

## API Endpoints

### Connection — `/api/connection`

| Method | Endpoint                      | Descrição                    |
|--------|-------------------------------|------------------------------|
| POST   | `/api/connection/connect`     | Cria conexão (PostgreSQL/SQLite) |
| GET    | `/api/connection/list`        | Lista conexões ativas        |
| DELETE | `/api/connection/{id}`        | Remove conexão               |
| GET    | `/api/connection/{id}/schema` | Schema DDL da conexão        |

### Query — `/api/query`

| Method | Endpoint              | Descrição                              |
|--------|-----------------------|----------------------------------------|
| POST   | `/api/query/validate` | Analisa a query (HITL check)           |
| POST   | `/api/query/execute`  | Executa query — retorna `403` se destrutiva sem `skip_confirmation=true` |
| POST   | `/api/query/preview`  | Executa com `LIMIT 100` automático     |
| GET    | `/api/query/is-safe`  | `?query=...` — verificação rápida      |

### AI — `/api/ai`

| Method | Endpoint               | Descrição                         |
|--------|------------------------|-----------------------------------|
| GET    | `/api/ai/providers`    | Lista providers e modelos         |
| POST   | `/api/ai/config`       | Configura chave de API do provider|
| DELETE | `/api/ai/config/{p}`   | Remove chave de API               |
| POST   | `/api/ai/chat`         | Chat com AI (inclui schema no contexto) |
| POST   | `/api/ai/suggest`      | Sugestão de query SQL             |
| POST   | `/api/ai/analyze`      | Análise de risco da query         |
| DELETE | `/api/ai/history`      | Limpa histórico de chat           |

### Context — `/api/context`

| Method | Endpoint                        | Descrição                            |
|--------|---------------------------------|--------------------------------------|
| GET    | `/api/context/schema/{conn_id}` | Retorna schema armazenado no contexto|
| POST   | `/api/context/schema/{conn_id}` | Extrai schema da conexão ativa → LLM |
| DELETE | `/api/context/schema`           | Limpa contexto de schema             |
| DELETE | `/api/context/history`          | Limpa histórico de chat do contexto  |

### Utilitário

| Method | Endpoint   | Descrição          |
|--------|------------|--------------------|
| GET    | `/`        | Info da API        |
| GET    | `/health`  | Status + uptime    |
| GET    | `/docs`    | Swagger UI         |

---

## LLM Providers Suportados

| Provider  | Modelos                                     |
|-----------|---------------------------------------------|
| OpenAI    | gpt-5, gpt-5-mini, o1-preview               |
| Gemini    | gemini-3-pro, gemini-3-flash                |
| DeepSeek  | deepseek-v3, deepseek-r1                    |
| Nvidia    | GLM 5, Minimax 2.5, Qwen 3.5               |
| Anthropic | claude-4.6-sonnet, claude-4.6-opus          |

---

## Módulos Chave — Detalhes de Implementação

### `core/query_filter.py` — QueryFilter

```python
# Operações interceptadas
DESTRUCTIVE_KEYWORDS = ['UPDATE','DELETE','DROP','ALTER','TRUNCATE','INSERT']

def analyze(query: str) -> QueryAnalysis:
    # 1. strip_comments() — remove --, /* */, #
    # 2. normalize_query() — colapsa espaços
    # 3. extract_first_keyword() — regex no início
    # 4. Se destrutivo → extract_tables() por regex específico por operação
    # 5. Retorna QueryAnalysis(is_destructive, operation_type, tables_affected, ...)
```

### `db/metadata.py` — SchemaExtractor

```python
class SchemaExtractor:
    async def extract(engine, conn_id) -> SchemaResponse:
        # run_sync() para usar inspector síncrono dentro de conexão async
        # Itera schemas → tabelas → colunas (com PK, nullable, tipo)
        # Busca views e funções (PostgreSQL)
```

### `api/dependencies.py` — FastAPI Depends

```python
get_connection_info(connection_id: str) -> ConnectionInfo   # 404 se ausente
get_active_connection(conn) -> ConnectionInfo               # 503 se inativo
get_engine(conn) -> AsyncEngine                             # 503 se engine ausente
```

### `llm/context.py` — ContextManager

Singleton que mantém:
- `_raw_schema_text` — texto DDL formatado para o LLM
- `_current_schema` — SchemaInfo estruturado
- `_query_history` — deque(maxlen=50)
- `_chat_history` — deque(maxlen=20)

Métodos: `get_schema_context()`, `set_schema_context(text)`, `add_chat_message()`, `get_chat_messages_for_llm()`

---

## Configuração

### Variáveis de Ambiente (`backend/.env`)

```env
BACKEND_HOST=localhost
BACKEND_PORT=8000
DEBUG=false
ENCRYPTION_KEY=<gerado automaticamente>
SESSION_SECRET=<gerado automaticamente>
MAX_QUERY_HISTORY=50
MAX_CHAT_HISTORY=20
QUERY_TIMEOUT=30
```

### Tauri IPC Command

| Comando          | Retorno                  | Uso                                   |
|------------------|--------------------------|---------------------------------------|
| `get_backend_url`| `"http://localhost:8000"`| Frontend obtém URL do backend em runtime |

---

## Como Rodar

### Desenvolvimento

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (web mode)
cd frontend
npm install
npm run dev

# Terminal 2 — Frontend (Tauri desktop, requer Rust)
npm run tauri:dev
```

### Testes

```bash
cd backend
pytest tests/ -v
# Esperado: 29 testes passando
```

### Build Produção

```bash
# 1. Empacotar backend como sidecar
cd backend && python scripts/build_sidecar.py

# 2. Build do app desktop
cd frontend && npm run tauri:build
```

---

## Fases de Desenvolvimento

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Backend Foundation — FastAPI, HITL filter, LiteLLM | ✅ |
| 2 | Database Layer — ConnectionManager, SchemaExtractor | ✅ |
| 3 | Query Engine — execução real, preview, HITL gate | ✅ |
| 4 | AI Integration — chat, suggest, analyze, context route | ✅ |
| 4.5 | Tauri Desktop — sidecar, IPC, ícones, build pipeline | ✅ |
| 5 | Polish & Security — testes automatizados, CI, docs | 🔄 Em progresso |

---

## Histórico de Versões

| Versão | Data       | Mudanças |
|--------|------------|----------|
| 0.1.0  | 2025-03-25 | Backend scaffolding inicial |
| 0.2.0  | 2025-03-25 | Frontend base, componentes, API client |
| 0.3.0  | 2025-03-25 | Zustand, HITL modal, ConnectionModal, SQL highlighting |
| 0.4.0  | 2026-03-25 | Tauri v2, backend completo (execução real + schema extractor), 29 testes, ícones |

---

**Last Updated**: 2026-03-25  
**Version**: 0.4.0  
**Author**: AI Agent (System Architecture)
