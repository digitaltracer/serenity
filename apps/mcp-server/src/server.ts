import express, { Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import {
  requireAuth,
  AuthenticatedRequest,
  requestLogger,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  mcpRateLimiter,
  healthRateLimiter,
} from './middleware/index.js';
import {
  registerTaskTools,
  registerJournalTools,
  registerProjectTools,
  registerGoalTools,
  registerAITools,
  toolHandlers,
  type UserContext
} from './tools/index.js';

export const app = express();

// Middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
}));

app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// Health check endpoint with rate limiting
app.get('/health', healthRateLimiter, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'serenity-mcp-server',
    version: '1.0.0',
  });
}));

// Root endpoint
app.get('/', (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    name: 'Serenity MCP Server',
    version: '1.0.0',
    description: 'MCP server for Serenity Notes - manage tasks, journal entries, projects, goals, and AI insights',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)',
    },
    tools: {
      tasks: 6,
      journal: 6,
      projects: 5,
      goals: 5,
      ai: 3,
      total: 25,
    },
    documentation: 'See README.md for usage instructions',
  });
});

// MCP Server initialization
export const mcpServer = new Server(
  {
    name: 'serenity-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools (populates toolHandlers map)
registerTaskTools(mcpServer);
registerJournalTools(mcpServer);
registerProjectTools(mcpServer);
registerGoalTools(mcpServer);
registerAITools(mcpServer);

// MCP endpoint with authentication and rate limiting
app.post('/mcp', mcpRateLimiter, requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // At this point, user is authenticated (req.user is populated)
  logger.info('MCP request received', {
    userId: req.user?.id,
    userEmail: req.user?.email,
    method: req.body?.method,
  });

  // Parse request body
  const { method, params } = req.body || {};

  // Handle different MCP methods
  if (method === 'tools/list') {
    // Return list of available tools
    return res.json({
      tools: [
        {
          name: 'get-tasks',
          description: 'Retrieve tasks for the authenticated user with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', enum: ['all', 'active', 'completed'], default: 'active' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              projectId: { type: 'string', format: 'uuid' },
              tags: { type: 'array', items: { type: 'string' } },
              search: { type: 'string' },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            },
          },
        },
        {
          name: 'create-task',
          description: 'Create a new task',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 1, maxLength: 500 },
              description: { type: 'string', maxLength: 5000 },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
              dueDate: { type: 'string', format: 'date-time' },
              tags: { type: 'array', items: { type: 'string' }, default: [] },
            },
            required: ['title'],
          },
        },
        {
          name: 'update-task',
          description: 'Update an existing task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', format: 'uuid' },
              title: { type: 'string', minLength: 1, maxLength: 500 },
              description: { type: 'string', maxLength: 5000 },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              completed: { type: 'boolean' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'complete-task',
          description: 'Mark a task as completed',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', format: 'uuid' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'delete-task',
          description: 'Delete a task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', format: 'uuid' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'add-subtask',
          description: 'Add a subtask to a task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', format: 'uuid' },
              title: { type: 'string', minLength: 1, maxLength: 500 },
            },
            required: ['taskId', 'title'],
          },
        },
        // Journal tools
        {
          name: 'get-journal-entries',
          description: 'Retrieve journal entries with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              dateFrom: { type: 'string', format: 'date-time' },
              dateTo: { type: 'string', format: 'date-time' },
              mood: { type: 'string', enum: ['happy', 'neutral', 'sad', 'excited', 'stressed'] },
              tags: { type: 'array', items: { type: 'string' } },
              search: { type: 'string' },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            },
          },
        },
        {
          name: 'create-journal-entry',
          description: 'Create a new journal entry',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 1, maxLength: 500 },
              content: { type: 'string', minLength: 1 },
              mood: { type: 'string', enum: ['happy', 'neutral', 'sad', 'excited', 'stressed'] },
              tags: { type: 'array', items: { type: 'string' }, default: [] },
              date: { type: 'string', format: 'date-time' },
            },
            required: ['content'],
          },
        },
        {
          name: 'update-journal-entry',
          description: 'Update an existing journal entry',
          inputSchema: {
            type: 'object',
            properties: {
              entryId: { type: 'string', format: 'uuid' },
              title: { type: 'string', minLength: 1, maxLength: 500 },
              content: { type: 'string', minLength: 1 },
              mood: { type: ['string', 'null'], enum: ['happy', 'neutral', 'sad', 'excited', 'stressed', null] },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['entryId'],
          },
        },
        {
          name: 'delete-journal-entry',
          description: 'Delete a journal entry',
          inputSchema: {
            type: 'object',
            properties: {
              entryId: { type: 'string', format: 'uuid' },
            },
            required: ['entryId'],
          },
        },
        {
          name: 'search-journal',
          description: 'Full-text search across journal entries',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', minLength: 1 },
              limit: { type: 'number', minimum: 1, maximum: 50, default: 20 },
            },
            required: ['query'],
          },
        },
        {
          name: 'get-entry-by-date',
          description: 'Get journal entry for a specific date',
          inputSchema: {
            type: 'object',
            properties: {
              date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            },
            required: ['date'],
          },
        },
        // Project tools
        {
          name: 'get-projects',
          description: 'Retrieve projects with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              archived: { type: 'boolean' },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
              offset: { type: 'number', minimum: 0, default: 0 },
            },
          },
        },
        {
          name: 'create-project',
          description: 'Create a new project',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 255 },
              description: { type: 'string', maxLength: 5000 },
              color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              icon: { type: 'string', maxLength: 50 },
            },
            required: ['name'],
          },
        },
        {
          name: 'update-project',
          description: 'Update an existing project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', format: 'uuid' },
              name: { type: 'string', minLength: 1, maxLength: 255 },
              description: { type: 'string', maxLength: 5000 },
              color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
              icon: { type: 'string', maxLength: 50 },
              archived: { type: 'boolean' },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'archive-project',
          description: 'Archive a project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', format: 'uuid' },
            },
            required: ['projectId'],
          },
        },
        {
          name: 'delete-project',
          description: 'Delete a project',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', format: 'uuid' },
            },
            required: ['projectId'],
          },
        },
        // Goal tools
        {
          name: 'get-goals',
          description: 'Retrieve goals with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'completed', 'paused', 'failed'] },
              type: { type: 'string', enum: ['weekly_tasks', 'project_tasks', 'priority_tasks', 'daily_streak', 'journal_weekly', 'completion_rate'] },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
              offset: { type: 'number', minimum: 0, default: 0 },
            },
          },
        },
        {
          name: 'create-goal',
          description: 'Create a new goal',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 1, maxLength: 255 },
              description: { type: 'string', maxLength: 5000 },
              type: { type: 'string', enum: ['weekly_tasks', 'project_tasks', 'priority_tasks', 'daily_streak', 'journal_weekly', 'completion_rate'] },
              config: {
                type: 'object',
                properties: {
                  targetCount: { type: 'number', minimum: 1 },
                  projectId: { type: 'string', format: 'uuid' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  streakDays: { type: 'number', minimum: 1 },
                  targetRate: { type: 'number', minimum: 0, maximum: 100 },
                  timeframe: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
                },
                required: ['timeframe'],
              },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
            },
            required: ['title', 'type', 'config'],
          },
        },
        {
          name: 'update-goal',
          description: 'Update an existing goal',
          inputSchema: {
            type: 'object',
            properties: {
              goalId: { type: 'string', format: 'uuid' },
              title: { type: 'string', minLength: 1, maxLength: 255 },
              description: { type: 'string', maxLength: 5000 },
              status: { type: 'string', enum: ['active', 'completed', 'paused', 'failed'] },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
            required: ['goalId'],
          },
        },
        {
          name: 'track-progress',
          description: 'Track progress for a goal',
          inputSchema: {
            type: 'object',
            properties: {
              goalId: { type: 'string', format: 'uuid' },
              current: { type: 'number', minimum: 0 },
            },
            required: ['goalId', 'current'],
          },
        },
        {
          name: 'delete-goal',
          description: 'Delete a goal',
          inputSchema: {
            type: 'object',
            properties: {
              goalId: { type: 'string', format: 'uuid' },
            },
            required: ['goalId'],
          },
        },
        // AI tools
        {
          name: 'get-insights',
          description: 'Retrieve AI-generated insights with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['tasks', 'journal', 'habits', 'goals'] },
              type: { type: 'string', enum: ['productivity', 'behavior', 'recommendation', 'warning'] },
              limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
              offset: { type: 'number', minimum: 0, default: 0 },
            },
          },
        },
        {
          name: 'generate-insights',
          description: 'Generate new AI insights based on tasks and journal data',
          inputSchema: {
            type: 'object',
            properties: {
              dataTypes: { type: 'array', items: { type: 'string', enum: ['tasks', 'journal'] }, minItems: 1 },
              analysisMode: { type: 'string', enum: ['incremental', 'window', 'full'], default: 'incremental' },
              timeWindow: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                },
                required: ['start', 'end'],
              },
            },
            required: ['dataTypes'],
          },
        },
        {
          name: 'generate-summary',
          description: 'Generate a weekly or monthly summary/recap',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['weekly', 'monthly'] },
              period: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                },
                required: ['start', 'end'],
              },
            },
            required: ['type', 'period'],
          },
        },
      ],
    });
  }

  if (method === 'tools/call') {
    // Handle tool call
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    if (!toolName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Tool name is required',
      });
    }

    // Check if tool exists
    const handler = toolHandlers[toolName];
    if (!handler) {
      return res.status(404).json({
        error: 'Tool Not Found',
        message: `Tool "${toolName}" does not exist`,
        availableTools: Object.keys(toolHandlers),
      });
    }

    try {
      // Call tool handler with user context
      const context: UserContext = {
        userId: req.user!.id,
        userEmail: req.user!.email,
        userName: req.user!.name || undefined,
      };

      const result = await handler(toolArgs, context);

      return res.json(result);
    } catch (error) {
      logger.error('Tool execution error', {
        toolName,
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
      });

      return res.status(500).json({
        error: 'Tool Execution Error',
        message: error instanceof Error ? error.message : 'An error occurred while executing the tool',
      });
    }
  }

  // Unknown method
  return res.status(400).json({
    error: 'Bad Request',
    message: `Unknown MCP method: ${method}`,
    supportedMethods: ['tools/list', 'tools/call'],
  });
}));

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

export function startServer(): void {
  app.listen(config.port, () => {
    logger.info(`Serenity MCP Server running on http://localhost:${config.port}`, {
      environment: config.nodeEnv,
      allowedOrigins: config.allowedOrigins,
    });
  });
}

export default app;
