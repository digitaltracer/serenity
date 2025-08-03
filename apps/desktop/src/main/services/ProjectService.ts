/**
 * Project Business Logic Service
 * Handles project operations with validation and business rules
 */

interface ProjectData {
  name: string;
  description?: string;
  color: string;
  archived: boolean;
}

interface ProjectUpdate {
  name?: string;
  description?: string;
  color?: string;
  archived?: boolean;
}

export class ProjectService {
  private sqliteService: any = null;

  private async getSqliteService() {
    if (!this.sqliteService) {
      const { sqliteService } = await import('@serenity/database');
      this.sqliteService = sqliteService;
      await this.sqliteService.initialize();
    }
    return this.sqliteService;
  }

  /**
   * Get all projects with business logic
   */
  async getAllProjects() {
    try {
      console.log('📁 ProjectService: Getting all projects');
      const service = await this.getSqliteService();
      const projects = await service.getProjects();
      
      // Business logic: Sort projects by name, with active projects first
      const sortedProjects = projects.sort((a: any, b: any) => {
        // Active projects first
        if (a.archived !== b.archived) {
          return a.archived ? 1 : -1;
        }
        
        // Then alphabetically by name
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      
      console.log(`✅ ProjectService: Retrieved ${sortedProjects.length} projects`);
      return { success: true, data: sortedProjects };
    } catch (error) {
      console.error('❌ ProjectService: Failed to get projects:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve projects' 
      };
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string) {
    try {
      console.log('📁 ProjectService: Getting project:', id);
      
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Project ID is required' };
      }

      const service = await this.getSqliteService();
      const project = await service.getProject(id);
      
      if (!project) {
        return { success: false, error: 'Project not found' };
      }
      
      console.log('✅ ProjectService: Project retrieved:', project.name);
      return { success: true, data: project };
    } catch (error) {
      console.error('❌ ProjectService: Failed to get project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve project' 
      };
    }
  }

  /**
   * Create a new project with validation
   */
  async createProject(projectData: ProjectData) {
    try {
      console.log('📁 ProjectService: Creating new project:', projectData.name);
      
      // Validation
      if (!projectData.name || projectData.name.trim().length === 0) {
        return { success: false, error: 'Project name is required' };
      }
      
      if (projectData.name.length > 100) {
        return { success: false, error: 'Project name cannot exceed 100 characters' };
      }
      
      if (projectData.description && projectData.description.length > 1000) {
        return { success: false, error: 'Project description cannot exceed 1000 characters' };
      }
      
      // Validate color format (should be hex color)
      if (projectData.color && !/^#[0-9A-F]{6}$/i.test(projectData.color)) {
        return { success: false, error: 'Project color must be a valid hex color (e.g., #FF0000)' };
      }

      // Business logic: Check for duplicate names
      const service = await this.getSqliteService();
      const existingProjects = await service.getProjects();
      const duplicateName = existingProjects.some((project: any) => 
        project.name.toLowerCase() === projectData.name.trim().toLowerCase() && !project.archived
      );
      
      if (duplicateName) {
        return { success: false, error: 'A project with this name already exists' };
      }

      // Sanitize and format data
      const sanitizedProject = {
        ...projectData,
        name: projectData.name.trim(),
        description: projectData.description?.trim() || '',
        color: projectData.color || '#3B82F6', // Default blue color
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newProject = await service.createProject(sanitizedProject);
      
      console.log('✅ ProjectService: Project created successfully:', newProject.id);
      return { success: true, data: newProject };
    } catch (error) {
      console.error('❌ ProjectService: Failed to create project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create project' 
      };
    }
  }

  /**
   * Update a project with validation and business rules
   */
  async updateProject(id: string, updates: ProjectUpdate) {
    try {
      console.log('📁 ProjectService: Updating project:', id);
      
      // Validation
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Project ID is required' };
      }
      
      if (updates.name !== undefined) {
        if (updates.name.trim().length === 0) {
          return { success: false, error: 'Project name cannot be empty' };
        }
        if (updates.name.length > 100) {
          return { success: false, error: 'Project name cannot exceed 100 characters' };
        }
      }
      
      if (updates.description !== undefined && updates.description.length > 1000) {
        return { success: false, error: 'Project description cannot exceed 1000 characters' };
      }
      
      if (updates.color && !/^#[0-9A-F]{6}$/i.test(updates.color)) {
        return { success: false, error: 'Project color must be a valid hex color' };
      }

      const service = await this.getSqliteService();
      
      // Business logic: Check for duplicate names (if name is being updated)
      if (updates.name) {
        const existingProjects = await service.getProjects();
        const duplicateName = existingProjects.some((project: any) => 
          project.name.toLowerCase() === updates.name!.trim().toLowerCase() && 
          project.id !== id && 
          !project.archived
        );
        
        if (duplicateName) {
          return { success: false, error: 'A project with this name already exists' };
        }
      }

      // Sanitize updates
      const sanitizedUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      if (updates.name !== undefined) {
        sanitizedUpdates.name = updates.name.trim();
      }
      
      if (updates.description !== undefined) {
        sanitizedUpdates.description = updates.description.trim();
      }

      const updatedProject = await service.updateProject(id, sanitizedUpdates);
      
      console.log('✅ ProjectService: Project updated successfully:', id);
      return { success: true, data: updatedProject };
    } catch (error) {
      console.error('❌ ProjectService: Failed to update project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update project' 
      };
    }
  }

  /**
   * Delete a project with business rules
   */
  async deleteProject(id: string) {
    try {
      console.log('🗑️ ProjectService: Deleting project:', id);
      
      // Validation
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Project ID is required' };
      }

      const service = await this.getSqliteService();
      
      // Business logic: Check if project has associated tasks
      const tasks = await service.getTasks();
      const hasAssociatedTasks = tasks.some((task: any) => task.projectId === id);
      
      if (hasAssociatedTasks) {
        return { 
          success: false, 
          error: 'Cannot delete project with associated tasks. Please reassign or delete the tasks first, or archive the project instead.' 
        };
      }
      
      const deleted = await service.deleteProject(id);
      
      console.log('✅ ProjectService: Project deleted successfully:', id);
      return { success: true, data: deleted };
    } catch (error) {
      console.error('❌ ProjectService: Failed to delete project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete project' 
      };
    }
  }

  /**
   * Archive a project (business logic wrapper)
   */
  async archiveProject(id: string) {
    console.log('📦 ProjectService: Archiving project:', id);
    return this.updateProject(id, { archived: true });
  }

  /**
   * Unarchive a project (business logic wrapper)
   */
  async unarchiveProject(id: string) {
    console.log('📤 ProjectService: Unarchiving project:', id);
    return this.updateProject(id, { archived: false });
  }

  /**
   * Get project statistics (business logic)
   */
  async getProjectStats(id: string) {
    try {
      console.log('📊 ProjectService: Getting project statistics:', id);
      
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Project ID is required' };
      }

      const service = await this.getSqliteService();
      const tasks = await service.getTasks();
      const projectTasks = tasks.filter((task: any) => task.projectId === id);
      
      const stats = {
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((task: any) => task.completed).length,
        pendingTasks: projectTasks.filter((task: any) => !task.completed).length,
        highPriorityTasks: projectTasks.filter((task: any) => task.priority === 'high').length,
        overdueTasks: projectTasks.filter((task: any) => 
          task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
        ).length,
        completionRate: projectTasks.length > 0 
          ? Math.round((projectTasks.filter((task: any) => task.completed).length / projectTasks.length) * 100)
          : 0
      };
      
      console.log('✅ ProjectService: Project statistics calculated');
      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ ProjectService: Failed to get project statistics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get project statistics' 
      };
    }
  }
}

export const projectService = new ProjectService();