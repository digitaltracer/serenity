# Serenity MCP Server Guide

**Complete guide for hosting, connecting, and using the Serenity MCP Server**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Workflow](#architecture--workflow)
3. [VPS Hosting Guide](#vps-hosting-guide)
4. [Authentication Flow](#authentication-flow)
5. [Connecting AI Assistants](#connecting-ai-assistants)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

---

## Overview

### What is the Serenity MCP Server?

The Serenity MCP (Model Context Protocol) Server is a bridge that allows AI assistants (Claude Desktop, ChatGPT, etc.) to interact with your Serenity Notes account. Once connected, you can:

- Ask your AI to show your tasks
- Create and manage tasks through conversation
- Add journal entries by talking to your AI
- Manage projects, goals, and get AI insights
- Search through your entire journal history

### Key Features

- ✅ **Multi-tenant**: Multiple users can connect their own accounts
- ✅ **Secure OAuth 2.0**: Uses PKCE and refresh token rotation
- ✅ **25 Tools**: Full CRUD for tasks, journals, projects, goals, and AI insights
- ✅ **Self-hosted**: Runs on your own VPS (your data stays under your control)
- ✅ **Standard Compliant**: Follows MCP specification for broad compatibility

---

## Architecture & Workflow

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Computer                          │
│                                                                 │
│  ┌──────────────────┐              ┌────────────────────────┐  │
│  │  Claude Desktop  │              │  Web Browser           │  │
│  │  (or other AI)   │              │  (Serenity Web App)    │  │
│  └────────┬─────────┘              └───────────┬────────────┘  │
│           │                                    │                │
└───────────┼────────────────────────────────────┼────────────────┘
            │                                    │
            │ MCP Protocol                       │ HTTPS
            │ (with OAuth tokens)                │ (NextAuth session)
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VPS Server                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Nginx (Reverse Proxy)                │    │
│  │                                                          │    │
│  │  ┌───────────────────┐      ┌────────────────────────┐ │    │
│  │  │ mcp.serenity.app  │      │   serenity.app         │ │    │
│  │  │   Port 3001       │      │   Port 3000            │ │    │
│  │  └─────────┬─────────┘      └───────────┬────────────┘ │    │
│  └────────────┼──────────────────────────────┼──────────────┘    │
│               │                              │                  │
│  ┌────────────▼──────────┐      ┌───────────▼────────────┐     │
│  │   MCP Server          │      │   Next.js Web App      │     │
│  │   (Node.js/Express)   │◄─────┤   (OAuth provider)     │     │
│  │   - 25 MCP tools      │ Auth │   - User management    │     │
│  │   - OAuth validation  │ APIs │   - OAuth endpoints    │     │
│  └────────────┬──────────┘      └───────────┬────────────┘     │
│               │                              │                  │
│               └──────────────┬───────────────┘                  │
│                              │                                  │
│                    ┌─────────▼──────────┐                       │
│                    │   PostgreSQL       │                       │
│                    │   (Shared DB)      │                       │
│                    │   - Users          │                       │
│                    │   - Sessions       │                       │
│                    │   - Tasks/Journal  │                       │
│                    └────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

#### 1. Initial Connection Flow

```
User opens Claude Desktop
    ↓
Claude Desktop reads config file (~/.config/claude/config.json)
    ↓
Sees MCP server URL but no access token
    ↓
Prompts user: "Please authenticate with Serenity"
    ↓
User visits: https://serenity.app/settings/mcp
    ↓
Clicks "Connect New Assistant"
    ↓
OAuth flow begins...
    (detailed in Authentication Flow section)
    ↓
User receives access_token + refresh_token
    ↓
User adds tokens to Claude Desktop config
    ↓
Claude Desktop connects to MCP server
    ↓
All 25 tools are now available!
```

#### 2. Tool Call Flow

```
User in Claude Desktop: "What are my tasks for today?"
    ↓
Claude decides to call the "get-tasks" tool
    ↓
POST https://mcp.serenity.app/mcp
Headers: Authorization: Bearer <access_token>
Body: {
  "method": "tools/call",
  "params": {
    "name": "get-tasks",
    "arguments": { "filter": "active" }
  }
}
    ↓
MCP Server validates access_token:
  1. Checks if token exists in mcp_sessions table
  2. Checks if token is not expired (1 hour lifetime)
  3. Checks if token is not revoked
  4. Gets user_id from session
    ↓
MCP Server calls TaskService.getTasks(userId, { filter: 'active' })
    ↓
TaskService queries PostgreSQL:
  SELECT * FROM tasks
  WHERE user_id = $1 AND completed = false
  ORDER BY due_date ASC
    ↓
Returns tasks to Claude Desktop
    ↓
Claude formats response: "You have 5 tasks for today: 1. ..."
```

#### 3. Token Refresh Flow (Automatic)

```
Access token expires after 1 hour
    ↓
Claude Desktop detects 401 Unauthorized response
    ↓
POST https://serenity.app/api/oauth/mcp/token
Body: {
  "grant_type": "refresh_token",
  "refresh_token": "<refresh_token>",
  "client_id": "serenity-web"
}
    ↓
Server generates NEW access_token + NEW refresh_token
    ↓
OLD refresh_token is invalidated (rotation)
    ↓
Claude Desktop updates tokens in memory
    ↓
Retries original request with new access_token
```

---

## VPS Hosting Guide

### Prerequisites

- VPS with at least 2GB RAM (DigitalOcean, Linode, AWS EC2, etc.)
- Ubuntu 22.04 LTS (recommended)
- Domain name with DNS configured (e.g., `serenity.app`)
- SSL certificate (Let's Encrypt via Certbot)

### Step 1: Initial VPS Setup

```bash
# SSH into your VPS
ssh root@your-server-ip

# Update system packages
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Certbot (for SSL)
apt install -y certbot python3-certbot-nginx

# Create deployment user
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### Step 2: Clone and Build Application

```bash
# Clone repository (as deploy user)
cd ~
git clone https://github.com/your-org/serenity.git
cd serenity

# Install dependencies
npm install

# Build all packages
npm run build
```

### Step 3: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE serenity;
CREATE USER serenity_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE serenity TO serenity_user;
\q

# Run migrations
cd ~/serenity/apps/web
npm run migrate
```

### Step 4: Configure Environment Variables

**Web App Environment** (`~/serenity/apps/web/.env.production`):

```bash
# Database
DATABASE_URL=postgresql://serenity_user:your-secure-password@localhost:5432/serenity

# NextAuth
NEXTAUTH_URL=https://serenity.app
NEXTAUTH_SECRET=your-nextauth-secret-here

# OAuth Providers (Google, GitHub, etc.)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Public URL
NEXT_PUBLIC_APP_URL=https://serenity.app
```

**MCP Server Environment** (`~/serenity/apps/mcp-server/.env.production`):

```bash
# Database
DATABASE_URL=postgresql://serenity_user:your-secure-password@localhost:5432/serenity

# Server Configuration
PORT=3001
NODE_ENV=production
WEB_APP_URL=https://serenity.app

# CORS
ALLOWED_ORIGINS=https://serenity.app,https://mcp.serenity.app

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Logging
LOG_LEVEL=info

# Skip device flow in multi-tenant mode
SKIP_DEVICE_FLOW=true
```

### Step 5: Configure Nginx

**Create Nginx configuration** (`/etc/nginx/sites-available/serenity`):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name serenity.app mcp.serenity.app;
    return 301 https://$server_name$request_uri;
}

# Web App (Next.js)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name serenity.app;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/serenity.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/serenity.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# MCP Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mcp.serenity.app;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/serenity.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/serenity.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS headers for MCP
    add_header Access-Control-Allow-Origin "https://serenity.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=mcp_limit burst=20 nodelay;
    }
}
```

**Add rate limiting zone** (in `/etc/nginx/nginx.conf` inside `http` block):

```nginx
http {
    # ... existing config ...

    # Rate limiting for MCP endpoints
    limit_req_zone $binary_remote_addr zone=mcp_limit:10m rate=10r/s;
}
```

**Enable site and restart Nginx**:

```bash
sudo ln -s /etc/nginx/sites-available/serenity /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 6: Obtain SSL Certificates

```bash
# Get SSL certificates for both domains
sudo certbot --nginx -d serenity.app -d mcp.serenity.app

# Follow the prompts to:
# 1. Enter your email
# 2. Agree to terms
# 3. Choose whether to redirect HTTP to HTTPS (Yes)

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Start Applications with PM2

```bash
cd ~/serenity

# Start Web App
cd apps/web
pm2 start npm --name "serenity-web" -- start
pm2 save

# Start MCP Server
cd ../mcp-server
pm2 start npm --name "serenity-mcp" -- start
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Run the command it outputs (something like: sudo env PATH=... pm2 startup systemd -u deploy --hp /home/deploy)

# Check status
pm2 status
pm2 logs serenity-mcp  # View MCP server logs
```

### Step 8: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Step 9: Verify Deployment

```bash
# Test Web App
curl https://serenity.app/api/health
# Expected: {"status":"ok"}

# Test MCP Server
curl https://mcp.serenity.app/health
# Expected: {"status":"ok","service":"serenity-mcp-server"}

# Test tools list (should require auth)
curl https://mcp.serenity.app/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}'
# Expected: 401 Unauthorized (correct - requires authentication)
```

---

## Authentication Flow

### OAuth 2.0 with PKCE (For Web Users)

The Serenity MCP Server uses **OAuth 2.0 Authorization Code Grant with PKCE** (Proof Key for Code Exchange) for maximum security without requiring client secrets.

#### Step-by-Step Flow

**Step 1: User Initiates Connection**

```
User visits: https://serenity.app/settings/mcp
Clicks: "Connect New Assistant"
```

**Step 2: Authorization Request**

```
Browser redirects to:
https://serenity.app/api/oauth/mcp/authorize?
  client_id=serenity-web&
  redirect_uri=https://serenity.app/settings/mcp/callback&
  response_type=code&
  scope=mcp:read%20mcp:write&
  state=random-csrf-token&
  code_challenge=base64url(sha256(code_verifier))&
  code_challenge_method=S256
```

**Step 3: User Consent**

```
User sees consent screen showing:
┌──────────────────────────────────────┐
│  Authorize MCP Access                │
│                                      │
│  Claude Desktop wants to:            │
│  ✓ Read your tasks and journals      │
│  ✓ Create and update tasks           │
│  ✓ Manage projects and goals         │
│                                      │
│  Optional: Device Name               │
│  [My MacBook Pro             ]       │
│                                      │
│  [Deny]          [Authorize]         │
└──────────────────────────────────────┘
```

**Step 4: Authorization Code Issued**

```
User clicks "Authorize"
    ↓
Server creates authorization code (10 minute lifetime)
    ↓
Stores in database:
  - code: "auth_abc123..."
  - user_id: "user-uuid"
  - client_id: "serenity-web"
  - code_challenge: "hash from step 2"
  - expires_at: NOW() + 10 minutes
    ↓
Redirects to:
https://serenity.app/settings/mcp/callback?
  code=auth_abc123...&
  state=random-csrf-token
```

**Step 5: Token Exchange**

```
Frontend JavaScript calls:
POST https://serenity.app/api/oauth/mcp/token
{
  "grant_type": "authorization_code",
  "code": "auth_abc123...",
  "redirect_uri": "https://serenity.app/settings/mcp/callback",
  "client_id": "serenity-web",
  "code_verifier": "original-random-string"
}
    ↓
Server verifies:
  1. Code exists and not expired
  2. Code not already used
  3. PKCE verification: sha256(code_verifier) === code_challenge
  4. redirect_uri matches
    ↓
Server generates tokens:
  - access_token: random 64 chars (1 hour lifetime)
  - refresh_token: random 64 chars (90 day lifetime)
    ↓
Stores in mcp_sessions table:
  - user_id
  - access_token
  - refresh_token
  - access_token_expires_at
  - refresh_token_expires_at
  - device_name: "My MacBook Pro"
    ↓
Marks authorization code as used (exchanged_at = NOW())
    ↓
Returns to frontend:
{
  "access_token": "mcp_access_abc123...",
  "refresh_token": "mcp_refresh_xyz789...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_expires_in": 7776000,
  "scope": "mcp:read mcp:write"
}
```

**Step 6: User Configures AI Assistant**

```
User copies tokens and adds to Claude Desktop config:
{
  "mcpServers": {
    "serenity": {
      "url": "https://mcp.serenity.app/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer mcp_access_abc123..."
      }
    }
  }
}
```

### Token Lifecycle

**Access Token (1 hour lifetime):**
- Used for all MCP API requests
- Validated on every request
- Cannot be refreshed after expiry (must use refresh token)

**Refresh Token (90 day lifetime):**
- Used to get new access tokens
- Single-use with rotation (new refresh token issued on each refresh)
- If stolen refresh token is used, legitimate user's next refresh fails (breach detection)

**Refresh Process:**

```
Access token expires after 1 hour
    ↓
Client calls token endpoint:
POST https://serenity.app/api/oauth/mcp/token
{
  "grant_type": "refresh_token",
  "refresh_token": "mcp_refresh_xyz789...",
  "client_id": "serenity-web"
}
    ↓
Server validates refresh token:
  1. Token exists in database
  2. Token not expired
  3. Token not revoked
    ↓
Server generates NEW tokens:
  - New access_token (1 hour)
  - New refresh_token (90 days)
    ↓
Server invalidates OLD refresh token:
  UPDATE mcp_sessions
  SET refresh_token_revoked_at = NOW()
  WHERE refresh_token = 'old-token'
    ↓
Returns new tokens to client
```

### Device Flow (For Self-Hosted/Desktop)

For users running MCP server locally or on their own machine:

```
User starts MCP server without tokens
    ↓
Server calls: POST https://serenity.app/api/mcp/device/authorize
Returns:
{
  "device_code": "device_abc123",
  "user_code": "WXYZ-5678",
  "verification_uri": "https://serenity.app/device",
  "expires_in": 600
}
    ↓
Server displays to terminal:
┌────────────────────────────────────────┐
│  To authenticate with Serenity:        │
│                                        │
│  1. Visit: https://serenity.app/device │
│  2. Enter code: WXYZ-5678              │
│  3. Waiting for authorization...       │
└────────────────────────────────────────┘
    ↓
User visits URL and enters code
    ↓
Server polls: GET /api/mcp/device/status?device_code=device_abc123
  (Every 5 seconds)
    ↓
User approves in browser
    ↓
Poll returns:
{
  "status": "approved",
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600
}
    ↓
MCP server saves to ~/.serenity/mcp-session.json
    ↓
Future starts load tokens from file
```

---

## Connecting AI Assistants

### Connecting to Claude Desktop

Claude Desktop is the most common use case for MCP servers.

#### Step 1: Get OAuth Tokens

1. **Open web browser** and go to: `https://serenity.app`
2. **Sign in** with your account
3. **Navigate to Settings** → **MCP Connections**
4. **Click "Connect New Assistant"**
5. **Approve permissions** on consent screen
6. **Copy the tokens** displayed:
   - Access Token: `mcp_access_...`
   - Refresh Token: `mcp_refresh_...`

#### Step 2: Configure Claude Desktop

**On macOS:**

```bash
# Open config file
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**On Windows:**

```
# Navigate to:
%APPDATA%\Claude\claude_desktop_config.json
```

**On Linux:**

```bash
# Open config file
nano ~/.config/claude/claude_desktop_config.json
```

**Add Serenity MCP Server:**

```json
{
  "mcpServers": {
    "serenity": {
      "command": "node",
      "args": [],
      "env": {},
      "transport": "http",
      "url": "https://mcp.serenity.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

**Complete example with multiple servers:**

```json
{
  "mcpServers": {
    "serenity": {
      "transport": "http",
      "url": "https://mcp.serenity.app/mcp",
      "headers": {
        "Authorization": "Bearer mcp_access_kJ9mN3pQ7rT2vY8zA4bC6dF1gH5jK0lM"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/Documents"]
    }
  }
}
```

#### Step 3: Restart Claude Desktop

```bash
# Quit Claude Desktop completely (Cmd+Q on Mac)
# Relaunch Claude Desktop
```

#### Step 4: Verify Connection

In Claude Desktop, type:

```
Can you show me my tasks?
```

Claude should respond with your actual tasks from Serenity!

#### Step 5: Managing Tokens (Token Refresh)

**The access token expires after 1 hour.** You have two options:

**Option A: Manual Refresh (Simple)**

1. When you get authentication errors, go back to `https://serenity.app/settings/mcp`
2. Find your existing session
3. Click "Refresh Tokens"
4. Copy the new access token
5. Update Claude Desktop config
6. Restart Claude Desktop

**Option B: Automatic Refresh (Advanced)**

Create a wrapper script that handles refresh automatically:

**`~/serenity-mcp-wrapper.sh`:**

```bash
#!/bin/bash

# Load current tokens
CONFIG_FILE="$HOME/.config/serenity-mcp-tokens.json"
ACCESS_TOKEN=$(jq -r '.access_token' "$CONFIG_FILE")
REFRESH_TOKEN=$(jq -r '.refresh_token' "$CONFIG_FILE")
EXPIRES_AT=$(jq -r '.expires_at' "$CONFIG_FILE")

# Check if token expired
NOW=$(date +%s)
if [ "$NOW" -gt "$EXPIRES_AT" ]; then
  echo "Access token expired, refreshing..." >&2

  # Refresh token
  RESPONSE=$(curl -s -X POST https://serenity.app/api/oauth/mcp/token \
    -H "Content-Type: application/json" \
    -d "{
      \"grant_type\": \"refresh_token\",
      \"refresh_token\": \"$REFRESH_TOKEN\",
      \"client_id\": \"serenity-web\"
    }")

  # Extract new tokens
  NEW_ACCESS=$(echo "$RESPONSE" | jq -r '.access_token')
  NEW_REFRESH=$(echo "$RESPONSE" | jq -r '.refresh_token')
  EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in')
  NEW_EXPIRES_AT=$((NOW + EXPIRES_IN))

  # Save new tokens
  jq -n \
    --arg access "$NEW_ACCESS" \
    --arg refresh "$NEW_REFRESH" \
    --arg expires "$NEW_EXPIRES_AT" \
    '{access_token: $access, refresh_token: $refresh, expires_at: $expires}' \
    > "$CONFIG_FILE"

  ACCESS_TOKEN="$NEW_ACCESS"
fi

# Return current access token
echo "$ACCESS_TOKEN"
```

Then update Claude config to use the script:

```json
{
  "mcpServers": {
    "serenity": {
      "transport": "http",
      "url": "https://mcp.serenity.app/mcp",
      "headers": {
        "Authorization": "Bearer $(~/serenity-mcp-wrapper.sh)"
      }
    }
  }
}
```

### Connecting to ChatGPT (OpenAI)

ChatGPT doesn't natively support MCP yet, but you can use the MCP tools via API:

```python
import openai
import requests

# Your MCP access token
MCP_ACCESS_TOKEN = "mcp_access_..."

# Function to call MCP tool
def call_mcp_tool(tool_name, arguments):
    response = requests.post(
        "https://mcp.serenity.app/mcp",
        headers={
            "Authorization": f"Bearer {MCP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        },
        json={
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
    )
    return response.json()

# Define functions for OpenAI
functions = [
    {
        "name": "get_tasks",
        "description": "Get tasks from Serenity Notes",
        "parameters": {
            "type": "object",
            "properties": {
                "filter": {
                    "type": "string",
                    "enum": ["all", "active", "completed"]
                }
            }
        }
    }
]

# OpenAI chat with function calling
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "What are my tasks?"}],
    functions=functions,
    function_call="auto"
)

# If OpenAI wants to call get_tasks
if response.choices[0].message.get("function_call"):
    function_call = response.choices[0].message["function_call"]
    result = call_mcp_tool("get-tasks", json.loads(function_call["arguments"]))
    print(result)
```

### Connecting to Other AI Assistants

Any AI assistant that supports MCP can connect:

1. **Get OAuth tokens** from `https://serenity.app/settings/mcp`
2. **Configure MCP endpoint**: `https://mcp.serenity.app/mcp`
3. **Add Authorization header**: `Bearer <access_token>`
4. **Use tools** as defined in the MCP specification

---

## Troubleshooting

### Common Issues

#### 1. "401 Unauthorized" Error

**Cause:** Access token expired or invalid

**Solutions:**
```bash
# Check if token is valid
curl https://mcp.serenity.app/mcp \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}'

# If 401, refresh your token:
# 1. Visit https://serenity.app/settings/mcp
# 2. Click "Refresh Tokens" on your session
# 3. Update Claude Desktop config with new token
# 4. Restart Claude Desktop
```

#### 2. "Connection Refused" Error

**Cause:** MCP server is down or firewall blocking

**Solutions:**
```bash
# Check if MCP server is running
ssh deploy@your-server
pm2 status

# If stopped, restart it
pm2 restart serenity-mcp

# Check logs for errors
pm2 logs serenity-mcp --lines 50

# Test from server itself
curl http://localhost:3001/health

# Test firewall
sudo ufw status
```

#### 3. "Tool Not Found" Error

**Cause:** Tool name typo or server outdated

**Solutions:**
```bash
# List available tools
curl https://mcp.serenity.app/mcp \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}' | jq '.tools[].name'

# Update server to latest version
ssh deploy@your-server
cd ~/serenity
git pull
npm install
npm run build
pm2 restart serenity-mcp
```

#### 4. "Rate Limit Exceeded" Error

**Cause:** Too many requests in short time

**Solutions:**
```bash
# Wait 1 minute and try again
# Or increase rate limits in server config:
# Edit apps/mcp-server/.env.production
RATE_LIMIT_REQUESTS=200  # Increase from 100
RATE_LIMIT_WINDOW=60000  # 1 minute

# Restart server
pm2 restart serenity-mcp
```

#### 5. Database Connection Errors

**Cause:** PostgreSQL not running or wrong credentials

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql postgresql://serenity_user:password@localhost:5432/serenity -c "SELECT NOW();"

# Check environment variables
cat ~/serenity/apps/mcp-server/.env.production | grep DATABASE_URL

# View detailed error logs
pm2 logs serenity-mcp --lines 100 | grep -i "database\|postgres"
```

### Debugging Tips

**Enable Debug Logging:**

```bash
# Edit .env.production
LOG_LEVEL=debug

# Restart server
pm2 restart serenity-mcp

# View debug logs
pm2 logs serenity-mcp --lines 200
```

**Test Authentication Flow:**

```bash
# 1. Get session token from database
sudo -u postgres psql serenity
SELECT access_token, expires_at FROM mcp_sessions WHERE user_id = 'your-user-id';

# 2. Test token directly
curl https://mcp.serenity.app/mcp \
  -X POST \
  -H "Authorization: Bearer TOKEN_FROM_DB" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}'
```

**Monitor Server Health:**

```bash
# Create monitoring script
cat > ~/monitor-mcp.sh << 'EOF'
#!/bin/bash
while true; do
  STATUS=$(curl -s https://mcp.serenity.app/health | jq -r '.status')
  if [ "$STATUS" != "ok" ]; then
    echo "$(date): MCP Server DOWN - Status: $STATUS"
    pm2 restart serenity-mcp
  else
    echo "$(date): MCP Server OK"
  fi
  sleep 60
done
EOF

chmod +x ~/monitor-mcp.sh

# Run in background
nohup ~/monitor-mcp.sh >> ~/mcp-monitor.log 2>&1 &
```

---

## Advanced Configuration

### Multi-Region Deployment

For better performance, deploy MCP servers in multiple regions:

```
User Location → Nearest MCP Server → Shared Database

US East → mcp-us-east.serenity.app → Primary DB (US East)
EU West → mcp-eu-west.serenity.app → Read Replica (EU West)
Asia → mcp-asia.serenity.app → Read Replica (Asia)
```

**Load Balancer Configuration:**

```nginx
upstream mcp_servers {
    least_conn;
    server mcp-us-east.internal:3001;
    server mcp-eu-west.internal:3001;
    server mcp-asia.internal:3001;
}

server {
    listen 443 ssl http2;
    server_name mcp.serenity.app;

    location / {
        proxy_pass http://mcp_servers;
    }
}
```

### Database Read Replicas

For read-heavy workloads:

```javascript
// apps/mcp-server/src/config/database.js
const primaryDb = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const replicaDb = new Pool({
  connectionString: process.env.DATABASE_REPLICA_URL,
});

// Use replica for reads
export async function query(sql, params, { write = false } = {}) {
  const pool = write ? primaryDb : replicaDb;
  return pool.query(sql, params);
}
```

### Monitoring & Alerting

**Set up monitoring with Prometheus + Grafana:**

```bash
# Install Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.0/node_exporter-1.6.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.0.linux-amd64.tar.gz
sudo mv node_exporter-1.6.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo nano /etc/systemd/system/node_exporter.service
```

**Add application metrics:**

```javascript
// apps/mcp-server/src/middleware/metrics.js
import prometheus from 'prom-client';

const register = new prometheus.Registry();

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const toolCallCounter = new prometheus.Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of MCP tool calls',
  labelNames: ['tool_name', 'user_id'],
  registers: [register],
});

export { register, httpRequestDuration, toolCallCounter };
```

### Backup & Disaster Recovery

**Automated PostgreSQL Backups:**

```bash
# Create backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/serenity_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Backup database
pg_dump serenity | gzip > "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "serenity_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/
EOF

chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/deploy/backup-db.sh
```

### Security Hardening

**1. Enable HTTPS Only:**

```nginx
# Force HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**2. Implement IP Whitelisting (Optional):**

```nginx
# Only allow specific IPs
geo $allowed_ip {
    default 0;
    YOUR.PUBLIC.IP.HERE 1;
}

server {
    location /mcp {
        if ($allowed_ip = 0) {
            return 403;
        }
        # ... rest of config
    }
}
```

**3. Add Request Signing:**

```javascript
// Verify request signatures (optional additional security)
import crypto from 'crypto';

function verifySignature(req) {
  const signature = req.headers['x-mcp-signature'];
  const timestamp = req.headers['x-mcp-timestamp'];
  const body = JSON.stringify(req.body);

  const expected = crypto
    .createHmac('sha256', process.env.MCP_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Conclusion

You now have a complete guide to:

✅ **Deploy** the Serenity MCP Server on a VPS
✅ **Understand** the OAuth authentication flow
✅ **Connect** AI assistants like Claude Desktop
✅ **Troubleshoot** common issues
✅ **Scale** for production use

For additional help:
- **Documentation**: `apps/mcp-server/README.md`
- **Issues**: Check server logs with `pm2 logs serenity-mcp`
- **Support**: Visit `https://serenity.app/support`

**Happy connecting!** 🚀
