# AgentSQL — AI-Powered Database Management System

> **v0.5.0** · Tauri v2 · FastAPI · React 19 · SQLAlchemy 2.0 · LiteLLM

Gerenciador de banco de dados desktop com agente AI nativo. Conecte bancos PostgreSQL ou SQLite, escreva SQL com assistência de LLMs e execute queries com segurança — uma trava **Human-in-the-Loop** bloqueia automaticamente operações destrutivas até você confirmar.

---

## Features

- **Multi-Database** — PostgreSQL e SQLite (extensível via SQLAlchemy)
- **AI Assistant** — Chat com LLMs via LiteLLM; use sua própria chave de API
- **HITL Security** — Modal de confirmação obrigatório para `UPDATE` / `DELETE` / `DROP` / `ALTER` / `TRUNCATE` / `INSERT`
- **Schema Explorer** — Navegação em árvore: schemas, tabelas, colunas, tipos
- **SQL Editor** — Monaco Editor com syntax highlighting, Ctrl+Enter para executar
- **Results Grid** — Exibição tabular com colunas, linhas e execution time
- **Context API** — `POST /api/context/schema/{conn_id}` envia o DDL ao LLM antes de cada chat
- **Desktop Nativo** — App Tauri; backend Python empacotado como sidecar

---

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
│  │  +Schema │ │ (HITL gate)│ │   Router    │ │
│  │Extractor │ └────────────┘ └─────────────┘ │
│  └──────────┘                                 │
└───────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer     | Tecnologia                  | Versão    |
|-----------|-----------------------------|-----------|
| Desktop   | Tauri (Rust)                | v2        |
| Frontend  | React + TypeScript          | 19 / 5    |
| Estilo    | TailwindCSS                 | v4        |
| Editor    | Monaco Editor               | @4.7      |
| State     | Zustand                     | v5        |
| Backend   | Python + FastAPI            | 3.11+ / 0.109+ |
| ORM       | SQLAlchemy async            | 2.0       |
| Drivers   | asyncpg, aiosqlite          | —         |
| AI Router | LiteLLM                     | ≥1.20     |

---

## Quick Start

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- Rust + Cargo (apenas para modo desktop Tauri)

### Backend

```bash
cd backend
python -m venv venv

venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger interativo: <http://localhost:8000/docs>

### Frontend — modo web

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

### Frontend — modo desktop (Tauri)

```bash
# Instalar Rust: https://rustup.rs
cd frontend
npm run tauri:dev
```

> O backend deve estar rodando antes do frontend ser iniciado em qualquer modo.

### Testes

```bash
cd backend
pytest tests/ -v
# 30 testes passando (HITL filter + conexão SQLite + rotas FastAPI)
```

---

## Estrutura do Projeto

```
AgentSQL/
├── frontend/
│   ├── src/
│   │   ├── components/         # Layout, Sidebar, Editor, AIPanel,
│   │   │                       # SQLEditor, ConfirmationModal, ConnectionModal
│   │   ├── stores/             # Zustand: useConnectionStore, useQueryStore,
│   │   │                       #          useAIStore, useModalStore
│   │   ├── services/api.ts     # Cliente REST tipado
│   │   └── types/index.ts
│   └── src-tauri/
│       ├── src/lib.rs          # spawn sidecar (release) + DevTools (debug)
│       ├── tauri.conf.json     # janela 1400×900, externalBin
│       ├── capabilities/       # permissões Tauri v2
│       └── icons/              # 32x32, 128x128, 128x128@2x, ico, icns
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, routers
│   │   ├── api/
│   │   │   ├── dependencies.py     # Depends: connection / engine lookup
│   │   │   └── routes/
│   │   │       ├── connection.py   # /api/connection/*
│   │   │       ├── query.py        # /api/query/* — execução real
│   │   │       ├── ai.py           # /api/ai/*
│   │   │       └── context.py      # /api/context/* — schema → LLM
│   │   ├── core/
│   │   │   ├── config.py           # Settings (Pydantic)
│   │   │   ├── security.py         # Fernet + InMemoryKeyStore
│   │   │   └── query_filter.py     # HITL — QueryFilter
│   │   ├── db/
│   │   │   ├── connections.py      # ConnectionManager lifecycle
│   │   │   └── metadata.py         # SchemaExtractor (DDL inspection)
│   │   └── llm/
│   │       ├── router.py           # LiteLLM wrapper
│   │       └── context.py          # ContextManager (schema + history)
│   ├── tests/
│   │   ├── test_query_filter.py    # 11 testes HITL
│   │   ├── test_connections.py     # 8 testes SQLite in-memory
│   │   └── test_routes.py          # 11 testes de rota
│   ├── scripts/build_sidecar.py    # PyInstaller → sidecar Tauri
│   └── requirements.txt
│
├── system_context.md               # Referência técnica completa
└── README.md
```

---

## API Endpoints

### `/api/connection`

| Method | Endpoint         | Descrição                        |
|--------|-----------------|----------------------------------|
| POST   | `/connect`       | Criar conexão (PostgreSQL/SQLite) |
| GET    | `/list`          | Listar conexões ativas           |
| DELETE | `/{id}`          | Remover conexão                  |
| GET    | `/{id}/schema`   | Schema DDL da conexão            |

### `/api/query`

| Method | Endpoint    | Descrição                                           |
|--------|-------------|-----------------------------------------------------|
| POST   | `/validate` | Analisa query para HITL                             |
| POST   | `/execute`  | Executa — `HTTP 403` se destrutiva sem confirmação  |
| POST   | `/preview`  | Executa com `LIMIT 100` automático                  |
| GET    | `/is-safe`  | `?query=...` — verificação rápida                   |

### `/api/ai`

| Method | Endpoint      | Descrição                          |
|--------|---------------|------------------------------------|
| GET    | `/providers`  | Lista providers e modelos          |
| POST   | `/config`     | Configura chave API do provider    |
| POST   | `/chat`       | Chat com AI (schema no contexto)   |
| POST   | `/suggest`    | Geração de query SQL por prompt    |
| POST   | `/analyze`    | Análise de risco da query          |

### `/api/context`

| Method | Endpoint              | Descrição                           |
|--------|-----------------------|-------------------------------------|
| POST   | `/schema/{conn_id}`   | Extrai schema e carrega no LLM context |
| GET    | `/schema/{conn_id}`   | Lê o contexto de schema atual       |
| DELETE | `/schema`             | Limpa contexto de schema            |
| DELETE | `/history`            | Limpa histórico de chat             |

---

## Segurança

| Mecanismo              | Detalhe                                                        |
|------------------------|----------------------------------------------------------------|
| **HITL**               | `UPDATE/DELETE/DROP/ALTER/TRUNCATE/INSERT` bloqueados por padrão |
| **Chaves de API**      | In-memory apenas — nunca em disco, limpas ao reiniciar         |
| **Strings de conexão** | Criptografia AES-256 via Fernet/PBKDF2                         |
| **SQL injection**      | Todas as queries via `text()` SQLAlchemy — sem concatenação    |
| **Erros**              | Mensagens sanitizadas em produção (`DEBUG=false`)              |

---

## LLM Providers

| Provider  | Modelos                                                          |
|-----------|------------------------------------------------------------------|
| OpenAI    | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`        |
| Gemini    | `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-pro`              |
| DeepSeek  | `deepseek-chat`, `deepseek-coder`                               |
| Nvidia    | `nvidia/llama-3.1-nemotron-70b`, `nvidia/meta/llama-3.1-405b-instruct` |
| Anthropic | `claude-3-5-sonnet`, `claude-3-haiku`, `claude-3-opus`          |

Para adicionar novos modelos: edite `PROVIDERS` em `backend/app/llm/router.py`.

---

## Build de Produção

```bash
# 1. Empacotar backend como sidecar (requer PyInstaller)
cd backend
pip install pyinstaller
python scripts/build_sidecar.py
# → frontend/src-tauri/binaries/backend-x86_64-pc-windows-msvc.exe

# 2. Build do instalador desktop
cd frontend
npm run tauri:build
# → src-tauri/target/release/bundle/
```

---

## Fases de Desenvolvimento

- [x] **Fase 1** — Backend Foundation (FastAPI, HITL filter, LiteLLM)
- [x] **Fase 2** — Database Layer (ConnectionManager, SchemaExtractor)
- [x] **Fase 3** — Query Engine (execução real, HITL gate, preview)
- [x] **Fase 4** — AI Integration (chat, suggest, analyze, context route)
- [x] **Fase 4.5** — Tauri Desktop (sidecar, IPC, ícones, build pipeline)
- [ ] **Fase 5** — Polish & Security (CI/CD, testes E2E, ícones de produção)

---

## Contribuindo

1. Fork → crie branch `feature/nome`
2. Implemente e adicione testes (`pytest tests/ -v`)
3. Abra PR com descrição do que foi feito e por quê

---

## License

MIT
