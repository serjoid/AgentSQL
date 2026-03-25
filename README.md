# AgentSQL - AI-Powered Database Management System

Desktop database manager with a native AI Agent. Use your own API key (Gemini, OpenAI, etc.) to generate optimized SQL. Features a modern UI and a Human-in-the-loop security lock to prevent accidental destructive queries.

## Features

- **Multi-Database Support**: PostgreSQL, SQLite (extensible)
- **AI Assistant**: Integrated chat with LLMs (OpenAI, Gemini, DeepSeek, Nvidia, Anthropic)
- **Human-in-the-Loop**: Confirmation modal for destructive queries
- **Schema Explorer**: Tree-view navigation for databases, tables, columns
- **SQL Editor**: Syntax-highlighted query editor
- **Dark Mode**: Native dark theme support

## Architecture

```
┌─────────────────────────────────────────────┐
│           Tauri Desktop App                 │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐ │
│  │  React  │ │   SQL   │ │   AI Agent    │ │
│  │   UI    │ │  Editor │ │   Chat Panel  │ │
│  └────┬────┘ └────┬────┘ └───────┬───────┘ │
│       └───────────┴──────────────┘         │
│                   │                        │
└───────────────────┼────────────────────────┘
                    │ HTTP (localhost:8000)
                    ▼
┌───────────────────────────────────────────────┐
│           Python Backend (FastAPI)            │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐   │
│  │ SQLAlchemy│  Query  │ │    LiteLLM    │   │
│  │   ORM    │  Filter │ │    Router     │   │
│  └─────────┘ └─────────┘ └───────────────┘   │
└───────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | TailwindCSS v4 |
| Backend | Python 3.11+ / FastAPI |
| ORM | SQLAlchemy 2.0 |
| AI Router | LiteLLM |

## Project Structure

```
sgbd/
├── frontend/           # Tauri + React application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── services/
│   └── src-tauri/      # Rust backend
│
├── backend/            # Python FastAPI
│   ├── app/
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── db/
│   │   ├── llm/
│   │   └── models/
│   └── requirements.txt
│
└── system_context.md   # AI Agent knowledge base
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API Documentation: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run tauri dev
```

## API Endpoints

### Connection Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connection/connect` | Create DB connection |
| GET | `/api/connection/list` | List active connections |
| DELETE | `/api/connection/{id}` | Remove connection |
| GET | `/api/connection/{id}/schema` | Get schema metadata |

### Query Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/query/validate` | Check if query is destructive |
| POST | `/api/query/execute` | Execute SQL query |
| POST | `/api/query/preview` | Preview with LIMIT |

### AI Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/providers` | List available LLM providers |
| POST | `/api/ai/config` | Configure API key for provider |
| POST | `/api/ai/chat` | Chat with AI assistant |
| POST | `/api/ai/suggest` | Get query suggestions |
| POST | `/api/ai/analyze` | Analyze query for risks |

## Security

- **Human-in-the-Loop**: All destructive queries require explicit confirmation
- **Destructive Operations**: UPDATE, DELETE, DROP, ALTER, TRUNCATE, INSERT
- **API Keys**: Stored in-memory only, cleared on restart
- **Encryption**: AES-256-GCM for connection strings

## Supported LLM Providers

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Gemini | gemini-1.5-pro, gemini-1.5-flash |
| DeepSeek | deepseek-chat, deepseek-coder |
| Nvidia | llama-3.1-nemotron-70b |
| Anthropic | claude-3-5-sonnet, claude-3-haiku |

## Development Phases

- [x] **Phase 1**: Backend Foundation (API, Query Filter, LiteLLM)
- [ ] **Phase 2**: Database Layer (Connection Management, Schema Explorer)
- [ ] **Phase 3**: Query Engine (SQL Editor, Execution, Results Grid)
- [ ] **Phase 4**: AI Integration (Chat Panel, Context Assembly)
- [ ] **Phase 5**: Polish & Security (Testing, Documentation)

## License

MIT
