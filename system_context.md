# SGBD - AI-Powered Database Management System

## Overview

Desktop application for database management with native AI Agent integration. Users can connect to multiple database engines and use their own API keys to interact with LLMs for query assistance, schema exploration, and data analysis.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TAURI DESKTOP APP                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐  │
│  │   React     │    │    SQL      │    │          AI Agent               │  │
│  │  Frontend   │◄──►│   Editor    │◄──►│        Chat Panel               │  │
│  │    (UI)     │    │   + Grid    │    │        (Right Panel)            │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────────┬──────────────────┘  │
│         │                  │                          │                      │
│         └──────────────────┴──────────────────────────┘                      │
│                               │                                              │
│                      Tauri IPC Bridge                                        │
│                               │                                              │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                        PYTHON BACKEND (FastAPI)                               │
│                         localhost:8000                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐   │
│  │ SQLAlchemy  │    │   Query     │    │           LiteLLM               │   │
│  │   DB Layer  │◄──►│  Executor   │◄──►│           Router                │   │
│  └──────┬──────┘    └──────┬──────┘    └──────────────┬──────────────────┘   │
│         │                  │                          │                      │
│         └──────────────────┴──────────────────────────┘                      │
│                               │                                              │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
        ┌───────────────┐               ┌───────────────┐
        │   Database    │               │    LLM APIs   │
        │   Engines     │               │ (OpenAI,      │
        │(PostgreSQL,   │               │  Gemini,      │
        │   SQLite)     │               │  DeepSeek,    │
        └───────────────┘               │  Nvidia)      │
                                        └───────────────┘
```

## Tech Stack

| Layer              | Technology          | Purpose                              |
|--------------------|---------------------|--------------------------------------|
| Desktop Framework  | Tauri v2            | Native desktop wrapper (Rust)        |
| Frontend           | React 18 + TypeScript | UI components                      |
| Styling            | TailwindCSS v4      | Utility-first CSS                    |
| Backend            | Python 3.11+        | Core logic and data processing       |
| API Framework      | FastAPI             | Async REST API                       |
| ORM                | SQLAlchemy 2.0      | Database abstraction                 |
| AI Router          | LiteLLM             | Unified LLM API interface            |

## Business Rules

### Security Rules (CRITICAL)

1. **Human-in-the-Loop (HITL)**: All state-altering queries MUST be intercepted and require explicit user confirmation before execution.

2. **Blocked operations**:
   - UPDATE
   - DELETE
   - DROP
   - ALTER
   - TRUNCATE
   - INSERT

3. **AI restrictions**:
   - AI can ONLY generate/modify queries, NEVER execute them directly
   - AI suggestions pass through same HITL filter
   - User API keys stored in-memory only (never persisted, cleared on restart)

### Connection Management

- Users can save multiple database connections
- Connection credentials encrypted at rest
- Supported databases: PostgreSQL, SQLite

### AI Integration

- User provides their own API key per provider
- Supported providers: OpenAI, Gemini, DeepSeek, Nvidia NIM, Anthropic
- LiteLLM normalizes all calls to unified format
- Context window includes:
  - Current schema metadata
  - Recent queries (last N)
  - Chat history

## Data Flow

### Query Execution Flow

```
User Input
    │
    ▼
Syntax Validation
    │
    ▼
┌──────────────────┐
│   HITL Check     │
│ Query Filter     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Destructive?  Safe
    │           │
    ▼           ▼
┌────────┐   Execute
│ Modal  │   Directly
│Confirm?│
└────┬───┘
     │
  ┌──┴──┐
  │     │
 Yes    No
  │     │
  ▼     ▼
Execute Cancel
```

### AI Chat Flow

```
User Message
    │
    ▼
Context Assembly
    ├─ Current Schema
    ├─ Last N Queries
    └─ Chat History
    │
    ▼
LiteLLM Router
    │
    ▼
Provider API
    │
    ▼
Response
```

## Directory Structure

```
sgbd/
├── frontend/                    # Tauri + React (Phase 2)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── editor/
│   │   │   ├── sidebar/
│   │   │   ├── ai-panel/
│   │   │   └── modals/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── tauri.conf.json
│
├── backend/                     # Python FastAPI (Phase 1)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── connection.py
│   │   │   │   ├── query.py
│   │   │   │   └── ai.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── query_filter.py  # HITL logic
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── connections.py
│   │   │   └── metadata.py
│   │   ├── llm/
│   │   │   ├── __init__.py
│   │   │   ├── router.py        # LiteLLM wrapper
│   │   │   └── context.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── requests.py
│   │       └── responses.py
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docs/
│   └── system_context.md
│
└── README.md
```

## API Endpoints

### Connection Management

| Method | Endpoint          | Purpose                    |
|--------|-------------------|----------------------------|
| POST   | /api/connect      | Establish DB connection    |
| DELETE | /api/disconnect   | Close DB connection        |
| GET    | /api/connections  | List active connections    |

### Schema & Query

| Method | Endpoint              | Purpose                          |
|--------|-----------------------|----------------------------------|
| GET    | /api/schema/{conn_id} | Fetch schema metadata            |
| POST   | /api/query/validate   | Check if query is destructive    |
| POST   | /api/query/execute    | Execute query (with HITL bypass) |
| POST   | /api/query/preview    | Preview with LIMIT wrapper       |

### AI Agent

| Method | Endpoint            | Purpose                        |
|--------|---------------------|--------------------------------|
| POST   | /api/ai/chat        | Send message to AI agent       |
| POST   | /api/ai/config      | Set LLM provider + API key     |
| GET    | /api/ai/providers   | List available providers       |
| GET    | /api/ai/models      | List models for provider       |

## Configuration

### Environment Variables

```env
# Backend
BACKEND_PORT=8000
BACKEND_HOST=localhost
DEBUG=false

# Security (generated on first run)
ENCRYPTION_KEY=<auto-generated>
SESSION_SECRET=<auto-generated>
```

### In-Memory Storage

API keys are stored in memory during session:

```python
# Structure
api_keys: dict[str, str] = {
    "openai": "sk-...",
    "gemini": "AIza...",
    "deepseek": "sk-...",
    "nvidia": "nvapi-...",
    "anthropic": "sk-ant-..."
}
```

**Note**: Keys are cleared on backend restart. User must reconfigure.

## Supported LLM Providers

| Provider  | Model Format                        | Example Models                    |
|-----------|-------------------------------------|-----------------------------------|
| OpenAI    | `openai/{model}`                    | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Gemini    | `gemini/{model}`                    | gemini-1.5-pro, gemini-1.5-flash |
| DeepSeek  | `deepseek/{model}`                  | deepseek-chat, deepseek-coder    |
| Nvidia    | `nvidia/{model}`                    | nvidia/llama-3.1-nemotron-70b    |
| Anthropic | `anthropic/{model}`                 | claude-3-5-sonnet, claude-3-haiku|

## Security Considerations

1. **API Key Storage**: In-memory only, never persisted, cleared on restart
2. **SQL Injection**: Parameterized queries only (SQLAlchemy)
3. **Query Validation**: Regex + keyword extraction (no execution-based detection)
4. **Error Handling**: Sanitized messages, no internal paths exposed
5. **Encryption**: AES-256-GCM for future persistent storage

## HITL (Human-in-the-Loop) Implementation

### Query Filter Logic

```python
class QueryFilter:
    DESTRUCTIVE_KEYWORDS = [
        'UPDATE',
        'DELETE',
        'DROP',
        'ALTER',
        'TRUNCATE',
        'INSERT'
    ]

    def analyze(query: str) -> QueryAnalysis:
        # 1. Strip SQL comments
        # 2. Normalize whitespace
        # 3. Extract first SQL keyword
        # 4. Check against destructive list
        # 5. Extract affected tables via regex
        # 6. Return structured analysis
```

### QueryAnalysis Response

```python
@dataclass
class QueryAnalysis:
    is_destructive: bool
    operation_type: str | None      # e.g., "UPDATE", "DELETE"
    tables_affected: list[str]      # Extracted table names
    requires_confirmation: bool     # Always True if destructive
    raw_query: str
    normalized_query: str
```

## Development Phases

### Phase 1: Backend Foundation ✅
- Week 1-2: Project scaffolding, FastAPI setup, query filter, LiteLLM router

### Phase 2: Database Layer ✅
- Week 3-4: Connection management, SQLAlchemy, schema explorer

### Phase 3: Query Engine ✅
- Week 5-6: SQL Editor, execution, HITL modal, result grid

### Phase 4: AI Integration ✅
- Week 7-8: LiteLLM integration, chat panel, context assembly

### Phase 4.5: Tauri Desktop Integration ✅
- Tauri v2 scaffolding, sidecar wiring, build pipeline

### Phase 5: Polish & Security
- Week 9-10: Testing, error handling, documentation

## Version History

| Version | Date | Changes |
|---------|------------|------------------------------------------------------|
| 0.1.0 | 2025-03-25 | Initial backend scaffolding |
| 0.2.0 | 2025-03-25 | Frontend setup, base components, API client |
| 0.3.0 | 2025-03-25 | Zustand state, HITL modal, connection modal, SQL highlighting |
| 0.4.0 | 2026-03-25 | Tauri v2 integration — desktop shell, sidecar pipeline |

## Changelog

### v0.4.0 - Tauri Desktop Integration (2026-03-25)

#### New Files
| File | Purpose |
|------|---------|
| `frontend/src-tauri/Cargo.toml` | Rust crate definition — declares Tauri v2 + plugin deps |
| `frontend/src-tauri/build.rs` | Tauri build script (required by tauri-build) |
| `frontend/src-tauri/src/main.rs` | Binary entry point — calls `sgbd_lib::run()` |
| `frontend/src-tauri/src/lib.rs` | App setup: sidecar spawn (release only), DevTools (debug only) |
| `frontend/src-tauri/tauri.conf.json` | Window config, build commands, bundle settings |
| `frontend/src-tauri/capabilities/default.json` | Tauri v2 permission grants (window, shell, dialog) |
| `backend/pyproject.toml` | Package metadata + PyInstaller hidden-imports config |
| `backend/scripts/build_sidecar.py` | Builds the Python backend as a platform-specific sidecar binary |

#### Modified Files
| File | Change |
|------|--------|
| `frontend/vite.config.ts` | Added `TAURI_DEV_HOST` support, env prefix, per-platform build targets |
| `frontend/package.json` | Bumped to v0.4.0; added `@tauri-apps/api ^2`, `@tauri-apps/cli ^2`; added `tauri`, `tauri:dev`, `tauri:build` scripts |
| `.gitignore` | Added rules for `src-tauri/target/`, `src-tauri/gen/`, `src-tauri/binaries/`, PyInstaller artifacts |

#### Architecture: Sidecar Pattern
In **development**, the Python backend runs separately:
```
Terminal 1: cd backend && uvicorn app.main:app --reload
Terminal 2: cd frontend && npm run tauri:dev
```

In **production**, PyInstaller bundles the backend as a platform-specific binary that Tauri spawns on startup:
```
backend/scripts/build_sidecar.py
  → frontend/src-tauri/binaries/backend-{triple}.exe  (Windows)
  → frontend/src-tauri/binaries/backend-{triple}      (Linux/macOS)

npm run tauri:build
  → Bundles frontend + Rust shell + sidecar into a single installer
```

#### Tauri Commands (IPC)
| Command | Returns | Purpose |
|---------|---------|---------|
| `get_backend_url` | `"http://localhost:8000"` | Frontend can query the backend URL at runtime |

#### Prerequisites to run
- **Rust** toolchain: `rustup` + `cargo`
- **Node.js** ≥ 18 + `npm install` inside `frontend/`
- **Python** 3.11+ with `pip install -r backend/requirements.txt`
- **OS deps** (Linux only): `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

---

### v0.3.0 - State Management & UI Components (2025-03-25)

#### New Features
- **Zustand State Management**: Centralized stores for:
  - `useConnectionStore`: Database connections and schema
  - `useQueryStore`: Current query, history, results
  - `useAIStore`: AI messages, provider, model selection
  - `useModalStore`: Modal visibility states

#### New Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `ConfirmationModal` | `src/components/modals/ConfirmationModal.tsx` | HITL confirmation for destructive queries |
| `ConnectionModal` | `src/components/modals/ConnectionModal.tsx` | Database connection dialog |
| `SQLEditor` | `src/components/SQLEditor.tsx` | Custom SQL editor with syntax highlighting |

#### SQLEditor Features
- Line numbers
- Syntax highlighting for SQL keywords, strings, numbers, comments
- Tab key support (2 spaces)
- Ctrl+Enter to execute
- Custom dark theme colors

#### ConfirmationModal Features
- Operation type badge with color coding
- Affected tables display
- Full query preview
- Execute/Cancel buttons
- Escape key to close

#### ConnectionModal Features
- PostgreSQL and SQLite support
- Test connection button
- Form validation
- Connection status feedback

#### API Integration
- All components now use real backend API
- Query execution flow:
  1. Validate query via `/api/query/validate`
  2. If destructive → show ConfirmationModal
  3. If safe → execute directly
- Schema fetching on connection select
- AI provider configuration in panel

### v0.2.0 - Frontend Foundation (2025-03-25)

#### Backend Improvements
- Fixed import order in `ai.py` route (datetime import moved to top)
- Fixed import path in `connection.py` route (`..db.connections`)
- Fixed `add_chat_message` in `context.py` to accept dict and create ChatMessage

#### Frontend Implementation
- **Project Setup**: Vite + React 18 + TypeScript
- **Styling**: TailwindCSS v4 with custom CSS variables for theming
- **Font**: Inter (UI) + JetBrains Mono (code)

#### Components Created
| Component | Location | Purpose |
|-----------|----------|---------|
| `Layout` | `src/components/Layout.tsx` | Main 3-panel layout with resizable sidebars |
| `Sidebar` | `src/components/Sidebar.tsx` | Schema tree navigation with expandable tables |
| `Editor` | `src/components/Editor.tsx` | SQL editor + results grid |
| `AIPanel` | `src/components/AIPanel.tsx` | Chat interface with LLM provider selection |

#### Services
- `api.ts`: Backend API client with typed endpoints
  - Connection management (connect, disconnect, schema)
  - Query operations (validate, execute)
  - AI endpoints (providers, configure, chat, suggest)

#### Configuration Files
- `vite.config.ts`: Vite configuration with React plugin
- `tsconfig.json`: TypeScript configuration with path aliases
- `tailwind.config.js`: TailwindCSS with custom theme colors
- `postcss.config.js`: PostCSS configuration

#### Current Directory Structure
```
sgbd/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── ai.py          ✅ Fixed imports
│   │   │   ├── connection.py  ✅ Fixed imports
│   │   │   └── query.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── query_filter.py
│   │   ├── db/
│   │   │   └── connections.py
│   │   ├── llm/
│   │   │   ├── router.py
│   │   │   └── context.py    ✅ Fixed add_chat_message
│   │   ├── models/
│   │   ├── main.py
│   │   └── __init__.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx     ✅ 3-panel layout
│   │   │   ├── Sidebar.tsx    ✅ Schema explorer
│   │   │   ├── Editor.tsx     ✅ SQL editor + grid
│   │   │   └── AIPanel.tsx    ✅ AI chat panel
│   │   ├── services/
│   │   │   └── api.ts         ✅ Backend client
│   │   ├── types/
│   │   │   └── index.ts       ✅ TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── system_context.md
└── README.md
```

#### Next Steps (Phase 2)
1. **HITL Modal Component**: Confirmation dialog for destructive queries
2. **Tauri Integration**: Rust configuration for native desktop
3. **Real Database Connection**: Test PostgreSQL/SQLite connections
4. **State Management**: Implement Zustand or similar for app state
5. **Syntax Highlighting**: Monaco Editor or CodeMirror integration

---

**Last Updated**: 2026-03-25
**Author**: AI Agent (System Architecture)
