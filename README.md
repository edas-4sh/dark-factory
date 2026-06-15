# EDAS - Enhanced Development Assisting Software

**Dark Factory**: An autonomous AI agent system where 5 specialized agents work together to code, review, monitor, and maintain software projects.

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────┐
│   GitHub     │◄────►│          Orchestrator                │
│  (Issues,    │     │  - Work Discovery (issues/tasks)     │
│   PRs, Repos)│     │  - Task Queue & Assignment           │
└──────────────┘     │  - Agent Health Monitor              │
                     └───┬───┬───┬───┬───┬──────────────────┘
                         │   │   │   │   │
              ┌──────────┘   │   │   │   └──────────┐
              ▼              ▼   ▼   ▼               ▼
        ┌─────────┐   ┌────────────────────┐   ┌─────────┐
        │ Alpha   │   │  Beta, Gamma,      │   │Dashboard│
        │(Arch.)  │   │  Delta, Epsilon    │   │(React)  │
        └────┬────┘   └─────────┬──────────┘   └────┬────┘
             │                  │                    │
             └──────────────────┴────────────────────┘
                        OpenRouter API
                   (Free tier → Llama 3, Mixtral, etc.)
```

## Agents

| Agent | Name | Role | Specialty |
|-------|------|------|-----------|
| 🏗️ Alpha | Architect | System design, tech specs, planning |
| 🔧 Beta | Builder | Feature implementation, bug fixes |
| 👁️ Gamma | Reviewer | Code quality, linting, approvals |
| 🚀 Delta | DevOps | CI/CD, deps, Docker, deployments |
| 💊 Epsilon | Doctor | Health checks, metrics, error tracking |

Each agent operates in 3 modes:
- **Coder** — writes code, creates branches, opens PRs
- **Reviewer** — reviews diffs, approves/rejects PRs
- **Doctor** — monitors agent & system health

## Quick Start

```bash
git clone https://github.com/edas-4sh/dark-factory.git
cd dark-factory
cp .env.example .env
# Edit .env with your API keys
npm install
npm run build
npm run seed
npm run dev
```

- **Dashboard**: http://localhost:5173
- **Orchestrator API**: http://localhost:3001

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | API key from openrouter.ai (free tier) |
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope |
| `GITHUB_OWNER` | GitHub username/organization |
| `GITHUB_REPO` | Repository name to monitor |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email notification credentials |
| `NOTIFICATION_EMAIL` | Where to send alerts & digests |

## Deployment

### Render
Push to GitHub → connect repo at render.com → deploy from `render.yaml`.

### Docker
```bash
docker-compose up -d
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Monorepo**: npm workspaces + Turborepo
- **AI**: OpenRouter API (OpenAI-compatible, free models)
- **Database**: SQLite (sql.js)
- **Dashboard**: React + Vite + WebSockets
- **Hosting**: Render / Docker
