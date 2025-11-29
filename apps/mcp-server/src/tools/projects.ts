import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { projectService } from '../services/ProjectService.js';
import type { UserContext } from './index.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectFiltersSchema,
  deleteProjectSchema,
  archiveProjectSchema,
} from '../utils/validation.js';
import { toolHandlers } from './tasks.js';

/**
 * Register project management tools
 */
export function registerProjectTools(_server: Server): void {
  // Get projects with optional filters
  toolHandlers['get-projects'] = async (params: any, context: UserContext) => {
    const filters = params ? projectFiltersSchema.parse(params) : {};
    const projects = await projectService.getProjects(context.userId, filters);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ projects, count: projects.length }, null, 2),
        },
      ],
    };
  };

  // Create a new project
  toolHandlers['create-project'] = async (params: any, context: UserContext) => {
    const data = createProjectSchema.parse(params);
    const project = await projectService.createProject(context.userId, data);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            project,
            message: `Project "${project.name}" created successfully!`,
          }, null, 2),
        },
      ],
    };
  };

  // Update an existing project
  toolHandlers['update-project'] = async (params: any, context: UserContext) => {
    const { projectId, ...updateData } = updateProjectSchema.parse(params);
    const project = await projectService.updateProject(context.userId, projectId, updateData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            project,
            message: `Project "${project.name}" updated successfully!`,
          }, null, 2),
        },
      ],
    };
  };

  // Archive a project
  toolHandlers['archive-project'] = async (params: any, context: UserContext) => {
    const { projectId } = archiveProjectSchema.parse(params);
    const project = await projectService.archiveProject(context.userId, projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            project,
            message: `Project "${project.name}" archived successfully!`,
          }, null, 2),
        },
      ],
    };
  };

  // Delete a project
  toolHandlers['delete-project'] = async (params: any, context: UserContext) => {
    const { projectId } = deleteProjectSchema.parse(params);
    await projectService.deleteProject(context.userId, projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Project deleted successfully!',
          }, null, 2),
        },
      ],
    };
  };
}
