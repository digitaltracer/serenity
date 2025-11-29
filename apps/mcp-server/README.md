# Serenity MCP Server

> **Enable AI assistants (Claude, ChatGPT, Gemini) to manage your Serenity Notes tasks, projects, goals, and journal entries**

## Table of Contents

- [What is This? (For Non-Technical Users)](#what-is-this-for-non-technical-users)
- [What is MCP? (Technical Overview)](#what-is-mcp-technical-overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [How Authentication Works](#how-authentication-works)
- [Server Setup](#server-setup)
- [Connecting to AI Assistants](#connecting-to-ai-assistants)
  - [Claude Desktop](#connecting-to-claude-desktop)
  - [ChatGPT / OpenAI](#connecting-to-chatgpt--openai)
  - [Other AI Assistants](#connecting-to-other-ai-assistants)
- [Available Tools](#available-tools)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## What is This? (For Non-Technical Users)

**Imagine talking to ChatGPT or Claude and saying:**

> "What are my tasks for today?"
>
> "Add a journal entry about my morning meeting"
>
> "Create a new project called 'Home Renovation' with a blue color"
>
> "Track my progress on my weekly tasks goal"

**And it actually works!**

This MCP server is a bridge that connects AI assistants (like ChatGPT, Claude, or Gemini) to your Serenity Notes account. Once set up, you can:

- ✅ Ask your AI assistant to show your tasks
- ✅ Create and update tasks through conversation
- ✅ Add journal entries by just talking
- ✅ Manage projects and goals
- ✅ Search through your journal history

**It's like having an AI-powered personal assistant who has full access to your productivity app.**

### Is it Safe?

Yes! The MCP server:
- Only you can use it (requires your Serenity web app login)
- Runs on your own server or computer (your data stays with you)
- Uses the same authentication as the Serenity web app
- All communication is encrypted

---

## What is MCP? (Technical Overview)

**MCP (Model Context Protocol)** is an open standard created by Anthropic (and adopted by OpenAI and Google DeepMind) that allows AI assistants to interact with external tools and data sources in a standardized way.

Think of it like this:
- **Without MCP**: AI assistants are isolated - they can only chat, they can't *do* anything
- **With MCP**: AI assistants can call tools, access databases, interact with APIs

### The Serenity MCP Server

Our MCP server:
- Exposes **22 tools** (tasks, journal, projects, goals)
- Uses **HTTP transport** for production deployment
- Validates **NextAuth sessions** from the Serenity web app
- Shares the **same PostgreSQL database** (no data duplication)
- Follows the **MCP specification** for interoperability

---

## Features

### 🎯 Task Management (6 tools)
- List tasks with filters (active, completed, priority, project, tags)
- Create new tasks
- Update existing tasks
- Mark tasks as completed
- Delete tasks
- Add subtasks to tasks

### 📔 Journal Management (6 tools)
- List journal entries with filters (date range, mood, tags)
- Create new journal entries
- Update existing entries
- Delete entries
- Full-text search across all entries
- Get entry for a specific date

### 📁 Project Management (5 tools)
- List all projects
- Create new projects with custom colors and icons
- Update project details
- Archive projects
- Delete projects

### 🎯 Goal Management (5 tools)
- List goals with status filtering
- Create new goals (weekly tasks, daily streak, completion rate, etc.)
- Update goal details
- Track progress towards goals (auto-completion)
- Delete goals

### 🔒 Security
- **Session-based authentication** (reuses web app login)
- **Rate limiting** (100 requests/minute per user)
- **User-scoped data** (can only access your own data)
- **CORS protection**
- **Request logging and audit trails**

---

## Quick Start

### Prerequisites

1. **Serenity web app running** with PostgreSQL database
2. **Node.js 18+** installed
3. **A Serenity user account** (Google/GitHub/Microsoft login)

### 1. Install Dependencies

```bash
cd serenity
npm install
```

### 2. Configure Environment

Create `apps/mcp-server/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.com

# Database (same as web app)
DATABASE_URL=postgresql://user:password@localhost:5432/serenity

# Web App URL (for OAuth device flow)
WEB_APP_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Logging
LOG_LEVEL=info
```

### 3. Build the Server

```bash
npm run build
```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm run start
```

**First-time authentication**: When you start the server for the first time, you'll see:

```
╔════════════════════════════════════════════════════════════════════╗
║                  MCP Server Authentication                         ║
╚════════════════════════════════════════════════════════════════════╝

  To authorize this MCP server:

  1. Visit: http://localhost:3000/device
  2. Enter code: ABCD-1234

  Or open this URL in your browser:
  http://localhost:3000/device?code=ABCD-1234

  Waiting for authorization...
  (Code expires in 10 minutes)
```

1. Open the URL in your browser
2. Log in to Serenity (if not already logged in)
3. Enter the code and click "Authorize"
4. The MCP server will automatically receive the authorization and start!

Your session is saved to `~/.serenity/mcp-session.json` and will be reused on future startups (valid for 90 days).

### 5. Test the Server

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"...","service":"serenity-mcp-server","version":"1.0.0"}
```

---

## How Authentication Works

### Overview

The MCP server uses **OAuth 2.0 Device Authorization Grant** (like GitHub CLI, Heroku CLI) for user-friendly authentication. No need to manually extract tokens from your browser!

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  1. MCP server starts up                                     │
│  Checks for saved session at ~/.serenity/mcp-session.json   │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          v
            ┌─────────────┴──────────────┐
            │ Session found?             │
            └─────────────┬──────────────┘
                   No     │      Yes
         ┌────────────────┴────────────┐
         v                              v
┌────────────────────────┐    ┌────────────────────┐
│  2. Request device     │    │  7. Use existing   │
│  code from web app     │    │  session token     │
└────────┬───────────────┘    └────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  3. Display user-friendly code (e.g. WXYZ-5678)│
│  Show verification URL: /device                │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  4. User visits /device, logs in, enters code  │
│  Clicks "Authorize" to approve the device      │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  5. MCP server polls for approval status       │
│  (every 5 seconds)                             │
└────────┬───────────────────────────────────────┘
         │
         v
┌────────────────────────────────────────────────┐
│  6. Receives long-lived session token (90 days)│
│  Saves to ~/.serenity/mcp-session.json         │
└────────────────────────────────────────────────┘
```

### What Happens on Startup?

**First Time** (no saved session):
1. MCP server requests a device code from the web app
2. Displays a user-friendly code (e.g., "WXYZ-5678") and URL
3. You visit the URL, log in (if needed), and enter the code
4. Click "Authorize" to approve the device
5. MCP server receives a 90-day session token
6. Token is saved to `~/.serenity/mcp-session.json` (mode 0600)
7. MCP server starts successfully

**Subsequent Starts** (saved session exists):
1. MCP server loads token from `~/.serenity/mcp-session.json`
2. Validates token (checks expiration, revocation)
3. MCP server starts immediately - no user interaction needed!

### Session Management

**Viewing Active Sessions**:
- Visit `https://serenity.app/settings/mcp-sessions` in the web app
- See all devices that have authorized MCP access
- View device name, last used time, created date
- Revoke any session instantly

**Session Details**:
- ✅ Sessions expire after 90 days
- ✅ Sessions can be revoked from the web app
- ✅ Each session is tied to a specific device
- ✅ Tokens are stored with 0600 permissions (owner read/write only)
- ✅ Invalid/expired/revoked tokens trigger re-authentication

### Security Features

- ✅ **OAuth 2.0 RFC 8628 compliant** - Industry-standard device flow
- ✅ **User-friendly codes** - Format "XXXX-XXXX", no ambiguous characters (0, O, I, 1 removed)
- ✅ **Short device codes** - Expire in 10 minutes
- ✅ **Long sessions** - Valid for 90 days (revocable anytime)
- ✅ **Rate limiting** - 3 device codes/hour per IP, max 120 polls per code
- ✅ **High entropy tokens** - 64-character random strings (384 bits)
- ✅ **Separate token space** - MCP sessions isolated from web app sessions
- ✅ **Audit logging** - All authorization events tracked
- ✅ **Secure storage** - Session files created with 0600 permissions

---

## Server Setup

### Development Setup

```bash
# Navigate to MCP server directory
cd apps/mcp-server

# Install dependencies (if not already done)
npm install

# Run in development mode (auto-restart on changes)
npm run dev
```

### Production Deployment

#### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build the server
npm run build

# Start with PM2
pm2 start dist/index.js --name serenity-mcp

# View logs
pm2 logs serenity-mcp

# Setup auto-restart on system reboot
pm2 startup
pm2 save
```

#### Option 2: Docker

Create `apps/mcp-server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/mcp-server/package*.json ./apps/mcp-server/

# Install dependencies
RUN npm install --workspace=@serenity/mcp-server

# Copy source code
COPY apps/mcp-server ./apps/mcp-server
COPY packages ./packages

# Build
RUN npm run build --workspace=@serenity/mcp-server

EXPOSE 3001

CMD ["npm", "run", "start", "--workspace=@serenity/mcp-server"]
```

Build and run:

```bash
docker build -t serenity-mcp .
docker run -d -p 3001:3001 --env-file .env serenity-mcp
```

#### Option 3: Systemd Service

Create `/etc/systemd/system/serenity-mcp.service`:

```ini
[Unit]
Description=Serenity MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/serenity/apps/mcp-server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable serenity-mcp
sudo systemctl start serenity-mcp
sudo systemctl status serenity-mcp
```

### Production Checklist

- [ ] Database connection pooling configured
- [ ] Environment variables set (not hardcoded)
- [ ] HTTPS/TLS enabled (use reverse proxy like Nginx)
- [ ] Rate limiting enabled
- [ ] Logging configured (file + stdout)
- [ ] Health check endpoint working
- [ ] Firewall rules configured
- [ ] Backups enabled for PostgreSQL
- [ ] Monitoring/alerting set up (optional)

---

## Connecting to AI Assistants

### Connecting to Claude Desktop

**Prerequisites:**
- Claude Desktop app installed
- Serenity web app running
- A Serenity user account

**Steps:**

1. **Configure Claude Desktop**

   Open Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add MCP server configuration**:

```json
{
  "mcpServers": {
    "serenity": {
      "command": "node",
      "args": [
        "/path/to/serenity/apps/mcp-server/dist/index.js"
      ],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/serenity",
        "WEB_APP_URL": "http://localhost:3000",
        "PORT": "3001"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

4. **Authorize the MCP server**:

   When Claude Desktop starts the MCP server for the first time, you'll see a notification with:
   - A verification URL (e.g., `http://localhost:3000/device`)
   - A user-friendly code (e.g., `WXYZ-5678`)

   Simply visit the URL, enter the code, and authorize the device!

5. **Test the connection**:

   Ask Claude:
   ```
   "Can you show me my tasks for today?"
   ```

   Claude should now be able to access your Serenity data!

**Note**: The MCP server will save your session to `~/.serenity/mcp-session.json`. Future Claude Desktop restarts will use the saved session automatically.

### Connecting to ChatGPT / OpenAI

**Note**: As of November 2024, OpenAI is rolling out MCP support. Check [OpenAI's MCP documentation](https://platform.openai.com/docs) for the latest instructions.

**Expected configuration** (may vary):

1. **Use OpenAI's MCP client library**:

```bash
npm install @openai/mcp-client
```

2. **Create a custom ChatGPT plugin** or **use GPT Actions**:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Serenity MCP",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:3001"
    }
  ],
  "paths": {
    "/mcp": {
      "post": {
        "operationId": "callMcpTool",
        "summary": "Call MCP tool",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "method": { "type": "string" },
                  "params": { "type": "object" }
                }
              }
            }
          }
        },
        "security": [
          {
            "BearerAuth": []
          }
        ]
      }
    }
  },
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  }
}
```

3. **Configure authentication** in ChatGPT settings with your session token

### Connecting to Other AI Assistants

Any AI assistant that supports the **Model Context Protocol (MCP)** can connect to this server.

**General requirements:**
- HTTP transport support
- Bearer token authentication
- JSON-RPC 2.0 support

**Configuration pattern:**

```json
{
  "server": {
    "url": "http://localhost:3001/mcp",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer <your-session-token>",
      "Content-Type": "application/json"
    },
    "transport": "http"
  }
}
```

**Supported AI assistants** (as of December 2024):
- ✅ **Claude Desktop** (Anthropic) - Full support
- ✅ **ChatGPT** (OpenAI) - Rolling out
- 🔄 **Gemini** (Google DeepMind) - Announced, not yet available
- 🔄 **Copilot** (Microsoft) - Announced, not yet available

Check each AI assistant's documentation for specific MCP configuration instructions.

---

## Available Tools

The MCP server exposes **22 tools** across 4 categories:

### Task Tools (6)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-tasks` | List tasks with filters | `filter`, `priority`, `projectId`, `tags`, `search`, `limit` |
| `create-task` | Create a new task | `title`, `description`, `priority`, `dueDate`, `tags` |
| `update-task` | Update an existing task | `taskId`, `title`, `description`, `priority`, `completed` |
| `complete-task` | Mark a task as completed | `taskId` |
| `delete-task` | Delete a task | `taskId` |
| `add-subtask` | Add a subtask to a task | `taskId`, `title` |

### Journal Tools (6)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-journal-entries` | List journal entries | `dateFrom`, `dateTo`, `mood`, `tags`, `limit` |
| `create-journal-entry` | Create a new entry | `content`, `title`, `mood`, `tags`, `date` |
| `update-journal-entry` | Update an existing entry | `entryId`, `title`, `content`, `mood`, `tags` |
| `delete-journal-entry` | Delete an entry | `entryId` |
| `search-journal` | Full-text search | `query`, `limit` |
| `get-entry-by-date` | Get entry for specific date | `date` (YYYY-MM-DD) |

### Project Tools (5)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-projects` | List all projects | `archived`, `limit`, `offset` |
| `create-project` | Create a new project | `name`, `description`, `color`, `icon` |
| `update-project` | Update a project | `projectId`, `name`, `description`, `color`, `archived` |
| `archive-project` | Archive a project | `projectId` |
| `delete-project` | Delete a project | `projectId` |

### Goal Tools (5)

| Tool | Description | Parameters |
|------|-------------|------------|
| `get-goals` | List goals | `status`, `type`, `limit`, `offset` |
| `create-goal` | Create a new goal | `title`, `type`, `config`, `priority` |
| `update-goal` | Update a goal | `goalId`, `title`, `status`, `priority` |
| `track-progress` | Update goal progress | `goalId`, `current` |
| `delete-goal` | Delete a goal | `goalId` |

**See [API_REFERENCE.md](./API_REFERENCE.md) for detailed parameter specifications and examples.**

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Assistants                           │
│           (Claude Desktop, ChatGPT, Gemini)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ MCP Protocol (JSON-RPC 2.0)
                         │ HTTP POST /mcp
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   MCP Server (Node.js/Express)              │
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐│
│  │ Auth Layer    │  │ Tools Layer  │  │ Service Layer    ││
│  │ (NextAuth     │  │ (22 MCP      │  │ (TaskService,    ││
│  │ validation)   │  │ tools)       │  │ JournalService,  ││
│  │               │  │              │  │ ProjectService,  ││
│  │               │  │              │  │ GoalService)     ││
│  └───────┬───────┘  └──────┬───────┘  └─────────┬────────┘│
│          │                  │                     │         │
│          └──────────────────┴─────────────────────┘         │
│                              │                              │
│                    PostgresAdapter                          │
│                    (@serenity/database)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   PostgreSQL Database                       │
│     (Shared with Serenity Web App & Desktop App)           │
│                                                             │
│  Tables: users, sessions, tasks, subtasks,                 │
│          journal_entries, projects, goals                  │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. AI Assistant → HTTP POST /mcp
   {
     "method": "tools/call",
     "params": {
       "name": "get-tasks",
       "arguments": { "filter": "active" }
     }
   }
   Header: Authorization: Bearer <session-token>

2. MCP Server → Auth Middleware
   - Validates session token against sessions table
   - Checks expiration
   - Attaches user context to request

3. MCP Server → Rate Limiter
   - Checks request count (100/min per user)
   - Returns 429 if exceeded

4. MCP Server → Tool Handler
   - Validates arguments with Zod schema
   - Calls appropriate service method

5. Service → Database
   - Executes SQL query via PostgresAdapter
   - Returns results

6. MCP Server → AI Assistant
   {
     "content": [
       { "type": "text", "text": "{ tasks: [...] }" }
     ]
   }
```

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (via pg + custom adapter)
- **Validation**: Zod
- **Authentication**: NextAuth (session validation)
- **Logging**: Winston
- **TypeScript**: Strict mode
- **Monorepo**: Turborepo

### Key Design Decisions

1. **Shared Database** - No data duplication, single source of truth
2. **Session-based Auth** - Reuses web app authentication, no new credentials
3. **HTTP Transport** - Production-ready, scalable, firewall-friendly
4. **Service Layer** - Business logic separated from tool handlers
5. **Type Safety** - Shared types from `@serenity/core`, runtime validation with Zod

---

## Development

### Project Structure

```
apps/mcp-server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── server.ts             # Express app + MCP registration
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   ├── middleware/
│   │   ├── auth.ts           # NextAuth session validation
│   │   ├── error.ts          # Global error handler
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── logger.ts         # Request logging
│   ├── services/
│   │   ├── TaskService.ts    # Task CRUD operations
│   │   ├── JournalService.ts # Journal CRUD + search
│   │   ├── ProjectService.ts # Project management
│   │   └── GoalService.ts    # Goal tracking
│   ├── tools/
│   │   ├── index.ts          # Tool registration barrel
│   │   ├── tasks.ts          # 6 task tools
│   │   ├── journal.ts        # 6 journal tools
│   │   ├── projects.ts       # 5 project tools
│   │   └── goals.ts          # 5 goal tools
│   ├── types/
│   │   └── index.ts          # Type definitions
│   └── utils/
│       ├── validation.ts     # Zod schemas
│       ├── errors.ts         # Custom error classes
│       └── logger.ts         # Winston logger
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md                 # This file
```

### Adding a New Tool

1. **Create service method** in appropriate service file
2. **Add Zod schema** in `utils/validation.ts`
3. **Register tool handler** in appropriate `tools/*.ts` file
4. **Add tool definition** in `server.ts` tools/list response
5. **Build and test**

Example:

```typescript
// 1. Add to TaskService
async archiveTask(userId: string, taskId: string): Promise<Task> {
  // Implementation
}

// 2. Add Zod schema
export const archiveTaskSchema = z.object({
  taskId: uuidSchema,
});

// 3. Register tool
toolHandlers['archive-task'] = async (params: any, context: UserContext) => {
  const { taskId } = archiveTaskSchema.parse(params);
  const task = await taskService.archiveTask(context.userId, taskId);
  return { content: [{ type: 'text', text: JSON.stringify(task) }] };
};

// 4. Add to server.ts tools/list
{
  name: 'archive-task',
  description: 'Archive a task',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: { type: 'string', format: 'uuid' }
    },
    required: ['taskId']
  }
}
```

### Running Tests

```bash
# Unit tests (when implemented)
npm run test

# Integration tests (when implemented)
npm run test:integration

# Test with MCP Inspector
npx @modelcontextprotocol/inspector dist/index.js
```

### Debugging

Enable debug logging:

```bash
# Set LOG_LEVEL in .env
LOG_LEVEL=debug

# Or via environment variable
LOG_LEVEL=debug npm run dev
```

View logs:

```bash
# Development (console)
npm run dev

# Production (PM2)
pm2 logs serenity-mcp

# Production (journalctl)
sudo journalctl -u serenity-mcp -f
```

---

## Troubleshooting

### Authentication Errors

**Problem**: `401 Unauthorized - Invalid or expired session`

**Solutions**:
1. Check your session token is correct
2. Ensure you're logged into the web app
3. Session may have expired (30 days) - log in again
4. Database connection issues - check `DATABASE_URL`

### Connection Errors

**Problem**: `ECONNREFUSED` or `Cannot connect to server`

**Solutions**:
1. Check server is running: `curl http://localhost:3001/health`
2. Verify PORT in `.env` matches your configuration
3. Check firewall rules
4. Ensure database is accessible

### Database Errors

**Problem**: `Connection terminated` or `timeout`

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running
3. Verify database credentials
4. Check connection pool settings

### Rate Limiting

**Problem**: `429 Too Many Requests`

**Solutions**:
1. Wait 60 seconds for rate limit to reset
2. Reduce request frequency
3. Adjust `RATE_LIMIT_REQUESTS` in `.env` (not recommended for production)

### Tool Not Found

**Problem**: `Tool "xyz" does not exist`

**Solutions**:
1. Check tool name spelling
2. Restart server after adding new tools
3. Verify tool is registered in `server.ts`

---

## Security

### Best Practices

1. **Never commit `.env` files** to version control
2. **Use HTTPS in production** (reverse proxy like Nginx)
3. **Rotate session tokens regularly**
4. **Monitor audit logs** for suspicious activity
5. **Keep dependencies updated** (`npm audit`)
6. **Use strong database passwords**
7. **Limit network access** (firewall rules)
8. **Enable rate limiting** in production

### Security Features

- ✅ Session-based authentication (not API keys)
- ✅ User-scoped data access (can't see other users' data)
- ✅ Rate limiting (prevents abuse)
- ✅ CORS protection
- ✅ Input validation (Zod schemas)
- ✅ SQL injection protection (parameterized queries)
- ✅ Audit logging
- ✅ Request logging

### Reporting Security Issues

If you discover a security vulnerability, please email security@serenity.app (or your team email).

**Do not** open public GitHub issues for security vulnerabilities.

---

## License

MIT

---

## Support

- **Documentation**: See [docs/](../../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/serenity/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/serenity/discussions)

---

**Built with ❤️ using the Model Context Protocol (MCP)**
