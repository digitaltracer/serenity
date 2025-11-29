import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { aiService } from '../services/AIService.js';
import type { UserContext } from './index.js';
import {
  generateInsightsSchema,
  generateSummarySchema,
  getInsightsSchema,
} from '../utils/validation.js';
import { toolHandlers } from './tasks.js';

/**
 * Register AI analysis and insights tools
 */
export function registerAITools(_server: Server): void {
  // Get AI insights with optional filters
  toolHandlers['get-insights'] = async (params: any, context: UserContext) => {
    const filters = params ? getInsightsSchema.parse(params) : {};
    const insights = await aiService.getInsights(context.userId, filters);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ insights, count: insights.length }, null, 2),
        },
      ],
    };
  };

  // Generate new AI insights based on user data
  toolHandlers['generate-insights'] = async (params: any, context: UserContext) => {
    const validated = generateInsightsSchema.parse(params);

    // Build the request object with properly typed timeWindow
    const data: any = {
      dataTypes: validated.dataTypes,
      analysisMode: validated.analysisMode,
    };

    // Only add timeWindow if it has both start and end defined
    if (validated.timeWindow?.start && validated.timeWindow?.end) {
      data.timeWindow = {
        start: validated.timeWindow.start,
        end: validated.timeWindow.end,
      };
    }

    const insights = await aiService.generateInsights(context.userId, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            insights,
            count: insights.length,
            message: `Generated ${insights.length} insight${insights.length !== 1 ? 's' : ''} based on your ${validated.dataTypes.join(' and ')} data.`,
          }, null, 2),
        },
      ],
    };
  };

  // Generate a summary/recap for a time period
  toolHandlers['generate-summary'] = async (params: any, context: UserContext) => {
    const validated = generateSummarySchema.parse(params);

    // Ensure period has both start and end
    if (!validated.period?.start || !validated.period?.end) {
      throw new Error('Period must have both start and end dates');
    }

    const data: any = {
      type: validated.type,
      period: {
        start: validated.period.start,
        end: validated.period.end,
      },
    };

    const summary = await aiService.generateSummary(context.userId, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            summary,
            message: `Generated ${data.type} summary for ${data.period.start} to ${data.period.end}`,
          }, null, 2),
        },
      ],
    };
  };
}
