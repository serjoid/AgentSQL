# AgentSQL — AI-Powered Database Management System

Gerenciador de banco de dados desktop com agente AI nativo. Use sua própria chave de API (Gemini, OpenAI, etc.) para gerar SQL otimizado. Interface moderna com trava de segurança Human-in-the-Loop para prevenir queries destrutivas acidentais.

## Features

- **Multi-Database**: PostgreSQL, SQLite (extensível)
- **AI Assistant**: Chat com LLMs via LiteLLM (OpenAI, Gemini, DeepSeek, Nvidia, Anthropic)
- **HITL Security**: Modal de confirmação obrigatório para UPDATE / DELETE / DROP / ALTER / TRUNCATE / INSERT
- **Schema Explorer**: Navegação em árvore — databases, tabelas, colunas
- **SQL Editor**: Monaco Editor com syntax highlighting e execução real
- **Context Route**: `POST /api/context/schema/{conn_id}` — push do DDL para o LLM antes de cada chat
- **Dark Mode**: Tema escuro nativo

## Arquitetura

```
┌─────────────────────────────────────────────┐
│           Tauri Desktop App (v2)            │
│  ┌─────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  React  │ │ Monaco SQL  │ │  AI Chat  │ │
│  │ Zustand │ │   Editor    │ │   Panel   │ │
│  └────┬────┘ └──────┬──────┘ └─────┬─────┘ │
│       └─────────────┴───────────────┘        │
│               HTTP localhost:8000            │
└───────────────────┬──────────────────────────┘
                    ▼
┌───────────────────────────────────────────────┐
│           Python Backend (FastAPI)            │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ │
│  │SQLAlchemy│ │QueryFilter │ │   LiteLLM   │ │
│  │ + Schema │ │ (HITL gate)│ │   Router    │ │
│  │Extractor │ └────────────┘ └─────────────┘ │
│  └──────────┘                                 │
└───────────────────────────────────────────────┘
```

## Tech Stack

| Layer     | Tecnologia               |
|-----------|--------------------------|
| Desktop   | Tauri v2 (Rust)          |
| Frontend  | React 18 + TypeScript    |
| Estilo    | TailwindCSS v4           |
| Editor    | Monaco Editor            |
| State     | Zustand v5               |
| Backend   | Python 3.11+ / FastAPI   |
| ORM       | SQLAlchemy 2.0 async     |
| AI Router | LiteLLM                  |

## Estrutura do Projeto

```
AgentSQL/
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Editor, AIPanel,
│   │   │                   # SQLEditor, ConfirmationModal, ConnectionModal
│   │   ├── stores/         # useConnectionStore, useQueryStore,
│   │   │                   # useAIStore, useModalStore (Zustand)
│   │   ├── services/api.ts # Cliente REST tipado
│   │   └── types/
│   └── src-tauri/
│       ├── src/lib.rs      # spawn sidecar (release) + DevTools (debug)
│       ├── tauri.conf.json # janela 1400×900
│       ├── capabilities/   # permissões Tauri v2
│       └── icons/          # 32x32, 128x128, 128x128@2x, icon.ico
│
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + CORS + routers
│   │   ├── api/
│   │   │   ├── dependencies.py        # Depends: connection / engine
│   │   │   └── routes/
│   │   │       ├── connection.py      # /api/connection/*
│   │   │       ├── query.py           # /api/query/* (execução real)
│   │   │       ├── ai.py              # /api/ai/*
│   │   │       └── context.py         # /api/context/*
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic Settings
│   │   │   ├── security.py            # Fernet + InMemoryKeyStore
│   │   │   └── query_filter.py        # HITL — QueryFilter
│   │   ├── db/
│   │   │   ├── connections.py         # ConnectionManager lifecycle
│   │   │   └── metadata.py            # SchemaExtractor (DDL inspection)
│   │   └── llm/
│   │       ├── router.py              # LiteLLM wrapper
│   │       └── context.py             # ContextManager (schema + history)
│   ├── tests/
│   │   ├── test_query_filter.py       # 11 testes HITL
│   │   ├── test_connections.py        # 8 testes SQLite in-memory
│   │   └── test_routes.py             # 10 testes de rota
│   ├── scripts/build_sidecar.py       # PyInstaller → sidecar Tauri
│   └── requirements.txt
│
├── system_context.md
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docs interativas: http://localhost:8000/docs

### Frontend (Web)

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

### Desktop (requer Rust)

```bash
# Instalar Rust: https://rustup.rs
cd frontend
npm run tauri:dev
```

### Testes

```bash
cd backend
pytest tests/ -v   # 29 testes esperados
```

## API Endpoints

### Connection — `/api/connection`

| Method | Endpoint                      | Descrição |
|--------|-------------------------------|-----------|
| POST   | `/connect`                    | Criar conexão (PostgreSQL/SQLite) |
| GET    | `/list`                       | Listar conexões ativas |
| DELETE | `/{id}`                       | Remover conexão |
| GET    | `/{id}/schema`                | Schema DDL da conexão |

### Query — `/api/query`

| Method | Endpoint    | Descrição |
|--------|-------------|-----------|
| POST   | `/validate` | Analisa query (HITL check) |
| POST   | `/execute`  | Executa — `HTTP 403` se destrutiva sem confirmação |
| POST   | `/preview`  | Executa com `LIMIT 100` automático |
| GET    | `/is-safe`  | `?query=...` verificação rápida |

### AI — `/api/ai`

| Method | Endpoint         | Descrição |
|--------|------------------|-----------|
| GET    | `/providers`     | Lista providers e modelos |
| POST   | `/config`        | Configura chave API do provider |
| POST   | `/chat`          | Chat com AI (schema no contexto) |
| POST   | `/suggest`       | Sugestão de query SQL |
| POST   | `/analyze`       | Análise de risco da query |

### Context — `/api/context`

| Method | Endpoint                 | Descrição |
|--------|--------------------------|-----------|
| POST   | `/schema/{conn_id}`      | Extrai schema e carrega no LLM context |
| GET    | `/schema/{conn_id}`      | Lê o contexto de schema atual |
| DELETE | `/schema`                | Limpa contexto de schema |
| DELETE | `/history`               | Limpa histórico de chat |

## Segurança

- **HITL**: UPDATE, DELETE, DROP, ALTER, TRUNCATE, INSERT sempre requerem confirmação
- **Chaves de API**: memória apenas — nunca persistidas, limpas ao reiniciar
- **Strings de conexão**: criptografia AES-256 (Fernet/PBKDF2)
- **Queries**: sempre via `text()` SQLAlchemy — sem concatenação

## LLM Providers

| Provider  | Modelos                                   |
|-----------|-------------------------------------------|
| OpenAI    | gpt-5, gpt-5-mini, o1-preview             |
| Gemini    | gemini-3-pro, gemini-3-flash              |
| DeepSeek  | deepseek-v3, deepseek-r1                  |
| Nvidia    | GLM 5, Minimax 2.5, Qwen 3.5             |
| Anthropic | claude-4.6-sonnet, claude-4.6-opus        |

## Fases de Desenvolvimento

- [x] **Fase 1**: Backend Foundation (FastAPI, HITL filter, LiteLLM)
- [x] **Fase 2**: Database Layer (ConnectionManager, SchemaExtractor)
- [x] **Fase 3**: Query Engine (execução real, HITL gate, preview)
- [x] **Fase 4**: AI Integration (chat, suggest, analyze, context route)
- [x] **Fase 4.5**: Tauri Desktop (sidecar, IPC, ícones, build pipeline)
- [ ] **Fase 5**: Polish & Security (CI/CD, testes E2E, docs finais)

## License

MIT
