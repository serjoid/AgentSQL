# AgentSQL — AI-Powered Database Management System
## system_context.md — Referência Técnica Completa

---

## Visão Geral

Desktop app para gerenciamento de bancos de dados com agente AI nativo. O usuário conecta bancos de dados locais ou remotos, executa SQL com segurança HITL e usa sua própria chave de API (OpenAI, Gemini, DeepSeek, Nvidia, Anthropic) para geração e análise de queries.

---

## Arquitetura

### Fluxo de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TAURI DESKTOP APP                             │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────────────────┐   │
│  │   React    │   │  SQL Editor │   │       AI Agent           │   │
│  │  Zustand   │◄─►│  + Results  │◄─►│      Chat Panel          │   │
│  └─────┬──────┘   └──────┬──────┘   └─────────────┬────────────┘   │
│        └─────────────────┴──────────────────────────┘               │
│                           │  HTTP (localhost:8000)                   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND (FastAPI)                          │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────────────────┐   │
│  │ SQLAlchemy │   │ QueryFilter │   │        LiteLLM           │   │
│  │  + Schema  │◄─►│ (HITL gate) │◄─►│        Router            │   │
│  │ Extractor  │   └─────────────┘   └──────────────────────────┘   │
│  └────────────┘                                                      │
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

| Layer             | Tecnologia                           | Versão       |
|-------------------|--------------------------------------|--------------|
| Desktop           | Tauri                                | v2           |
| Frontend          | React + TypeScript                   | 19 / 5       |
| Estilo            | TailwindCSS + Design System custom   | v4           |
| Editor SQL        | Custom SQLEditor (syntax highlight)  | —            |
| State             | Zustand                              | v5           |
| Backend           | Python + FastAPI                     | 3.11+ / 0.109+ |
| ORM               | SQLAlchemy (async)                   | 2.0          |
| Drivers           | asyncpg (PostgreSQL), aiosqlite      | —            |
| AI Router         | LiteLLM                              | ≥1.20        |
| Desktop Shell     | Rust (tauri-plugin-shell, -dialog)   | —            |

---

## Design System (v0.7.0)

### Identidade Visual

Interface dark mode refinada, inspirada em ferramentas profissionais como Linear, Vercel e DataGrip.

### Paleta de Cores

```
Superfícies (sistema de elevação):
  --bg-deep:     #1A1A1D   (canvas base)
  --bg-surface:  #222226   (painéis, sidebar)
  --bg-elevated: #2A2A2F   (toolbars, headers)
  --bg-hover:    #32323A   (hover states)
  --bg-input:    #18181B   (inputs inset)

Acentos:
  --accent-cyan:       #00E5FF   (primário, active states)
  --accent-cyan-dim:   rgba(0,229,255,0.12)
  --accent-purple:     #9B51E0   (SQL keywords, brand)
  --accent-purple-dim: rgba(155,81,224,0.12)

Texto:
  --text-primary:   #E8E8ED   (texto principal)
  --text-secondary: #9898A0   (labels, suporte)
  --text-muted:     #5C5C66   (metadata, placeholders)

Bordas (rgba para blending):
  --border-subtle: rgba(255,255,255,0.06)
  --border-medium: rgba(255,255,255,0.10)
  --border-strong: rgba(255,255,255,0.16)

Semânticas:
  --success: #34D399   --warning: #FBBF24   --error: #F87171   --info: #00E5FF
```

### Tipografia

- **UI**: Inter, system-ui, sans-serif
- **Código**: Geist Mono, JetBrains Mono, Fira Code, monospace

### Layout da Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Title Bar: [≡] [A] AgentSQL — AI-Powered DB Manager    [AI ⚡] │
├──────┬──────────────┬───────────────────────┬───────────────────┤
│ Icon │   Sidebar    │    SQL Editor          │   AI Assistant    │
│ Strip│   Tree View  │    (syntax highlight)  │   Panel           │
│ 48px │   ~232px     │    flex-1              │   ~350px          │
│      │              ├───────────────────────┤                   │
│      │              │    Results Grid        │                   │
│      │              │    + footer bar        │                   │
├──────┴──────────────┴───────────────────────┴───────────────────┤
│ Status Bar: [conn] [● Online] [latency] [AgentSQL v0.7.0]      │
└─────────────────────────────────────────────────────────────────┘
```

### Syntax Highlighting (SQLEditor)

| Elemento     | Cor                    |
|-------------|------------------------|
| Keywords    | `#9B51E0` (purple)     |
| Strings     | `#00E5FF` (cyan)       |
| Numbers     | `#FBBF24` (amber)      |
| Comments    | `#5C5C66` (muted)      |

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
  ├─ Confirmado → Execute (skip_confirmation=true)
  └─ Cancelado  → Abort
```

`POST /api/query/execute` retorna **HTTP 403** se a query for destrutiva e `skip_confirmation=false`.

### Segurança

- Chaves de API em **memória apenas** — nunca persistidas, limpas ao reiniciar
- Strings de conexão criptografadas com AES-256 (Fernet/PBKDF2)
- Queries executadas via `text()` do SQLAlchemy (nunca concatenação de strings)
- Mensagens de erro sanitizadas em produção (`DEBUG=false`)
- Exceções de conexão propagadas — falhas não são silenciadas

---

## Estrutura de Diretórios (v0.7.0)

```
AgentSQL/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx              # Layout master: TitleBar + IconStrip + StatusBar + painéis
│   │   │   ├── Sidebar.tsx             # Schema explorer: tree view com type badges coloridos
│   │   │   ├── Editor.tsx              # SQL editor + results grid + footer (rows/time/HITL)
│   │   │   ├── AIPanel.tsx             # Assistant: chat bubbles com avatares, settings dropdown
│   │   │   ├── SQLEditor.tsx           # Editor SQL com syntax highlighting (purple/cyan/amber)
│   │   │   └── modals/
│   │   │       ├── ConfirmationModal.tsx   # HITL — confirmar query destrutiva (semantic colors)
│   │   │       └── ConnectionModal.tsx     # Nova conexão (PG / SQLite) — rounded-xl, cyan accent
│   │   ├── stores/
│   │   │   └── index.ts                # Zustand: useConnectionStore,
│   │   │                               # useQueryStore, useAIStore, useModalStore
│   │   ├── services/
│   │   │   └── api.ts                  # Cliente REST tipado (fetch + types)
│   │   └── types/index.ts
│   ├── src-tauri/
│   │   ├── Cargo.toml                  # Deps Rust: tauri v2, shell, dialog
│   │   ├── build.rs                    # tauri-build obrigatório
│   │   ├── tauri.conf.json             # Janela 1400×900, sidecar backend
│   │   ├── capabilities/default.json   # Permissões Tauri v2
│   │   ├── icons/                      # 32x32, 128x128, 128x128@2x, ico, icns
│   │   │   └── gen_icons.py            # Script para gerar ícones a partir de logo
│   │   └── src/
│   │       ├── main.rs                 # Entry point Rust
│   │       └── lib.rs                  # setup(): spawn sidecar (release) + DevTools (debug)
│   ├── package.json                    # @tauri-apps/api, @tauri-apps/cli, Vite
│   └── vite.config.ts                  # TAURI_DEV_HOST, envPrefix, build targets
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, CORS, routers (query/ai/connection/context)
│   │   ├── api/
│   │   │   ├── dependencies.py         # Depends: get_connection_info, get_active_connection, get_engine
│   │   │   └── routes/
│   │   │       ├── connection.py       # /api/connection/*
│   │   │       ├── query.py            # /api/query/* (execução real com perf_counter)
│   │   │       ├── ai.py               # /api/ai/*
│   │   │       └── context.py          # /api/context/* (schema → LLM context)
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings (env, auto-generate keys)
│   │   │   ├── security.py             # Fernet encrypt/decrypt, InMemoryKeyStore
│   │   │   └── query_filter.py         # HITL — regex + keyword extraction
│   │   ├── db/
│   │   │   ├── connections.py          # ConnectionManager lifecycle + execute_query
│   │   │   └── metadata.py             # SchemaExtractor — inspeciona DDL via SQLAlchemy inspector
│   │   ├── llm/
│   │   │   ├── router.py               # LiteLLM wrapper (chat, suggest, analyze)
│   │   │   └── context.py              # ContextManager (schema + query history + chat)
│   │   └── models/
│   │       ├── requests.py             # Pydantic request models
│   │       └── responses.py            # Pydantic response models
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_query_filter.py        # 11 testes — HITL filter (strip, analyze, injection)
│   │   ├── test_connections.py         # 8 testes — SQLite in-memory, schema, remove
│   │   └── test_routes.py              # 11 testes — health, connection, query, HITL 403
│   ├── scripts/
│   │   └── build_sidecar.py            # PyInstaller → binário Tauri (target-triple)
│   ├── requirements.txt                # prod + dev deps (pytest, httpx, pytest-asyncio)
│   ├── pyproject.toml                  # asyncio_mode=auto, testpaths, pythonpath
│   └── pyrightconfig.json              # Configuração Pylance/pyright
│
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-03-25-ui-redesign-design.md  # Spec do redesign da interface
│
├── system_context.md
└── README.md
```

---

## API Endpoints

### Connection — `/api/connection`

| Method | Endpoint                      | Descrição                        |
|--------|-------------------------------|----------------------------------|
| POST   | `/api/connection/connect`     | Cria conexão (PostgreSQL/SQLite) |
| GET    | `/api/connection/list`        | Lista conexões ativas            |
| DELETE | `/api/connection/{id}`        | Remove conexão e engine          |
| GET    | `/api/connection/{id}/schema` | Schema DDL da conexão            |

### Query — `/api/query`

| Method | Endpoint              | Descrição                                                          |
|--------|-----------------------|--------------------------------------------------------------------|
| POST   | `/api/query/validate` | Analisa a query (HITL check) — sem acesso ao banco                 |
| POST   | `/api/query/execute`  | Executa query — HTTP 403 se destrutiva sem `skip_confirmation=true` |
| POST   | `/api/query/preview`  | Executa com `LIMIT 100` automático                                 |
| GET    | `/api/query/is-safe`  | `?query=...` — verificação rápida de segurança                     |

### AI — `/api/ai`

| Method | Endpoint               | Descrição                              |
|--------|------------------------|----------------------------------------|
| GET    | `/api/ai/providers`    | Lista providers configurados e modelos |
| POST   | `/api/ai/config`       | Configura chave de API do provider     |
| DELETE | `/api/ai/config/{p}`   | Remove chave de API                    |
| POST   | `/api/ai/chat`         | Chat com AI (schema no contexto)       |
| POST   | `/api/ai/suggest`      | Geração de query SQL por prompt        |
| POST   | `/api/ai/analyze`      | Análise de risco da query              |
| DELETE | `/api/ai/history`      | Limpa histórico de chat                |

### Context — `/api/context`

| Method | Endpoint                        | Descrição                                    |
|--------|---------------------------------|----------------------------------------------|
| GET    | `/api/context/schema/{conn_id}` | Retorna schema armazenado no LLM context     |
| POST   | `/api/context/schema/{conn_id}` | Extrai schema da conexão ativa → ContextManager |
| DELETE | `/api/context/schema`           | Limpa contexto de schema                     |
| DELETE | `/api/context/history`          | Limpa histórico de chat do contexto          |

### Utilitário

| Method | Endpoint   | Descrição            |
|--------|------------|----------------------|
| GET    | `/`        | Info e versão da API |
| GET    | `/health`  | Status + uptime      |
| GET    | `/docs`    | Swagger UI           |
| GET    | `/redoc`   | ReDoc UI             |

---

## LLM Providers Suportados

| Provider  | Modelos disponíveis                                         |
|-----------|-------------------------------------------------------------|
| OpenAI    | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`   |
| Gemini    | `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-pro`         |
| DeepSeek  | `deepseek-chat`, `deepseek-coder`                          |
| Nvidia    | `nvidia/llama-3.1-nemotron-70b`, `nvidia/meta/llama-3.1-405b-instruct` |
| Anthropic | `claude-3-5-sonnet`, `claude-3-haiku`, `claude-3-opus`     |

> Modelos definidos em `backend/app/llm/router.py → PROVIDERS`. Para adicionar novos basta estender o dict.

---

## Módulos Chave — Detalhes de Implementação

### `core/query_filter.py` — QueryFilter

```python
DESTRUCTIVE_KEYWORDS = ['UPDATE','DELETE','DROP','ALTER','TRUNCATE','INSERT']

def analyze(query: str) -> QueryAnalysis:
    # 1. strip_comments()       — remove --, /* */, #
    # 2. normalize_query()      — colapsa espaços
    # 3. extract_first_keyword()— regex no início da query normalizada
    # 4. Se destrutivo → extract_tables() por regex específico por operação
    # 5. Retorna QueryAnalysis(is_destructive, operation_type, tables_affected, ...)
```

### `db/connections.py` — ConnectionManager

```python
class ConnectionManager:
    # create_connection() — build URL, cria engine async, testa com text("SELECT 1"),
    #                       propaga exceção se falhar (não silencia)
    # get_schema()        — delega para schema_extractor.extract()
    # execute_query()     — executa SQL via engine, diferencia SELECT (rows) de DML (rowcount)
    # disconnect() / remove_connection() — dispose engine, limpa state
```

> **Bug corrigido (v0.5.0)**: variable shadowing em `async with engine.begin() as conn` —
> renomeado para `db_conn` para não sobrescrever o parâmetro `conn: ConnectionCreate`.

### `db/metadata.py` — SchemaExtractor

```python
class SchemaExtractor:
    async def extract(engine, conn_id) -> SchemaResponse:
        # run_sync() — inspector síncrono dentro de conexão async
        # Itera schemas → tabelas → colunas (PK, nullable, tipo, default)
        # Foreign keys e indexes por tabela
        # Views por schema
        # Funções via information_schema.routines (PostgreSQL; silenciado em SQLite)
```

### `api/dependencies.py` — FastAPI Depends

```python
get_connection_info(connection_id: str) -> ConnectionInfo  # HTTP 404 se ausente
get_active_connection(conn)             -> ConnectionInfo  # HTTP 503 se inativo
get_engine(conn)                        -> AsyncEngine     # HTTP 503 se engine ausente
```

> Parâmetro sem anotação `Query` para funcionar tanto com path params (contexto) quanto query params.

### `llm/context.py` — ContextManager

Singleton com deques bounded:
- `_raw_schema_text` — DDL formatado para o LLM (set via `/api/context/schema`)
- `_current_schema` — SchemaInfo estruturado (set programaticamente)
- `_query_history` — `deque(maxlen=MAX_QUERY_HISTORY)` (default 50)
- `_chat_history` — `deque(maxlen=MAX_CHAT_HISTORY)` (default 20)

### `Layout.tsx` — Componentes de Layout (v0.7.0)

```
Layout (master)
├── TitleBar        — Branding, hamburger menu, AI toggle button
├── IconStrip       — Navegação vertical (48px): Explorer, Schemas, Connections, Settings, User
│                     Active state: cyan accent pill (bg-accent-cyan-dim)
├── Sidebar         — Tree view: conexões → schemas → tabelas → colunas
│                     Type badges coloridos: int=blue, text=emerald, numeric=amber, bool=pink
│                     Seções colapsáveis: Tables, Views, Functions
├── Editor          — Toolbar com Execute (cyan), SQLEditor, ResultsGrid + footer
│                     Footer: row count, execution time (perf_counter), HITL status
├── AIPanel         — Settings (Provider/Model/API Key), Chat com avatares (AI=purple, User=circle)
│                     Bubbles: user=cyan-tinted, assistant=surface-colored
└── StatusBar       — Conexão ativa, status Online/Offline, versão
```

---

## Configuração

### Variáveis de Ambiente (`backend/.env`)

```env
BACKEND_HOST=localhost
BACKEND_PORT=8000
DEBUG=false
ENCRYPTION_KEY=<auto-gerado se ausente>
SESSION_SECRET=<auto-gerado se ausente>
MAX_QUERY_HISTORY=50
MAX_CHAT_HISTORY=20
QUERY_TIMEOUT=30
```

### Tauri IPC Commands

| Comando          | Retorno                   | Uso                                      |
|------------------|---------------------------|------------------------------------------|
| `get_backend_url`| `"http://localhost:8000"` | Frontend obtém URL do backend em runtime |

---

## Como Rodar

### Desenvolvimento

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Swagger: http://localhost:8000/docs

# Terminal 2 — Frontend (modo web)
cd frontend
npm install
npm run dev                  # http://localhost:3000

# Terminal 2 — Frontend (desktop Tauri, requer Rust)
npm run tauri:dev
```

### Testes

```bash
cd backend
pytest tests/ -v
# Resultado esperado: 30 testes passando
```

### Build Produção

```bash
# 1. Empacotar backend como sidecar PyInstaller
cd backend && python scripts/build_sidecar.py
# Output: frontend/src-tauri/binaries/backend-{triple}[.exe]

# 2. Build do app desktop
cd frontend && npm run tauri:build
# Output: instalador nativo em src-tauri/target/release/bundle/
```

### Ícones (branding)

```bash
# Regenerar com logo próprio (requer Pillow ou tauri CLI)
py -3 frontend/src-tauri/icons/gen_icons.py logo.png
# ou
cd frontend && npm run tauri icon -- logo.png
```

---

## Fases de Desenvolvimento

| Fase | Descrição                                                    | Status        |
|------|--------------------------------------------------------------|---------------|
| 1    | Backend Foundation — FastAPI, HITL filter, LiteLLM           | ✅ Completo   |
| 2    | Database Layer — ConnectionManager, SchemaExtractor          | ✅ Completo   |
| 3    | Query Engine — execução real, preview, HITL gate             | ✅ Completo   |
| 4    | AI Integration — chat, suggest, analyze, context route       | ✅ Completo   |
| 4.5  | Tauri Desktop — sidecar, IPC, ícones, build pipeline         | ✅ Completo   |
| 5    | Polish & Security — 30 testes, bug fixes, CI/CD, docs        | ✅ Completo   |
| 6    | UX & Native Feel — Tema Dark, Tailwind v4, Sidebar, AIPanel  | ✅ Completo   |
| 7    | UI Redesign — Design system, elevação, cyan/purple accents, layout profissional | ✅ Completo   |

---

## Histórico de Versões

| Versão | Data       | Mudanças                                                                    |
|--------|------------|-----------------------------------------------------------------------------|
| 0.1.0  | 2025-03-25 | Backend scaffolding inicial (FastAPI, HITL filter, LiteLLM router)          |
| 0.2.0  | 2025-03-25 | Frontend base — React, Layout, Sidebar, Editor, AIPanel, API client        |
| 0.3.0  | 2025-03-25 | Zustand stores, HITL modal, ConnectionModal, SQL highlighting               |
| 0.4.0  | 2026-03-25 | Tauri v2, metadata.py, dependencies.py, context route, execução real, ícones |
| 0.5.0  | 2026-03-25 | 30 testes passando; bug fixes: variable shadowing, imports relativos, `Query` vs path param |
| 0.6.0  | 2026-03-25 | Renomeando de SGBD para AgentSQL, ícone dedicado, Tailwind CSS v4 custom variables, AIPanel unificado e fix no sidecar |
| 0.7.0  | 2026-03-25 | **UI Redesign completo**: design system com tokens (cyan/purple), layout com TitleBar + IconStrip + StatusBar, tree view com type badges, chat bubbles com avatares, syntax highlighting (purple keywords, cyan strings), results grid com footer (rows/time/HITL), modals redesenhados com semantic colors, tipografia Geist Mono |
| 0.8.0  | 2026-03-25 | Bug fixes: backend sidecar startup crash (`run.py` wrapper, `--collect-all litellm`), frontend silenciando erros de conexão no `ConnectionModal`, ajustes de padding no AIPanel para não colar na borda da janela. |
| 0.9.0  | 2026-03-25 | **Dynamic AI Models**: Implementação de busca dinâmica de modelos via API (OpenAI/Gemini/DeepSeek), remoção de pre-fill de modelos (campo Model oculto até configuração), suporte a input de texto livre (datalist) para modelos customizados, e relaxamento de CORS para Tauri v2. |

---

**Last Updated**: 2026-03-25
**Version**: 0.9.0
**Author**: AI Agent (System Architecture)
