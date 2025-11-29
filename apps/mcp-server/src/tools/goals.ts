import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { goalService } from '../services/GoalService.js';
import type { UserContext } from './index.js';
import {
  createGoalSchema,
  updateGoalSchema,
  goalFiltersSchema,
  deleteGoalSchema,
  trackProgressSchema,
} from '../utils/validation.js';
import { toolHandlers } from './tasks.js';

/**
 * Register goal management tools
 */
export function registerGoalTools(_server: Server): void {
  // Get goals with optional filters
  toolHandlers['get-goals'] = async (params: any, context: UserContext) => {
    const filters = params ? goalFiltersSchema.parse(params) : {};
    const goals = await goalService.getGoals(context.userId, filters);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ goals, count: goals.length }, null, 2),
        },
      ],
    };
  };

  // Create a new goal
  toolHandlers['create-goal'] = async (params: any, context: UserContext) => {
    const data = createGoalSchema.parse(params);
    const goal = await goalService.createGoal(context.userId, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goal,
            message: `Goal "${goal.title}" created successfully!`,
          }, null, 2),
        },
      ],
    };
  };

  // Update an existing goal
  toolHandlers['update-goal'] = async (params: any, context: UserContext) => {
    const { goalId, ...updateData } = updateGoalSchema.parse(params);
    const goal = await goalService.updateGoal(context.userId, goalId, updateData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goal,
            message: `Goal "${goal.title}" updated successfully!`,
          }, null, 2),
        },
      ],
    };
  };

  // Track progress for a goal
  toolHandlers['track-progress'] = async (params: any, context: UserContext) => {
    const { goalId, current } = trackProgressSchema.parse(params);
    const goal = await goalService.trackProgress(context.userId, goalId, current);

    const completionMessage = goal.status === 'completed'
      ? ' Goal completed! 🎉'
      : '';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goal,
            message: `Progress updated: ${goal.progress.current}/${goal.progress.target} (${goal.progress.percentage}%)${completionMessage}`,
          }, null, 2),
        },
      ],
    };
  };

  // Delete a goal
  toolHandlers['delete-goal'] = async (params: any, context: UserContext) => {
    const { goalId } = deleteGoalSchema.parse(params);
    await goalService.deleteGoal(context.userId, goalId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Goal deleted successfully!',
          }, null, 2),
        },
      ],
    };
  };
}
