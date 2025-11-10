import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types';
import { generateId } from '../../utils';
import { loadProjects } from '../../utils/persistence';
import { logger } from '../../utils/logger';

export interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

// Load projects from localStorage on initialization
const initialProjects = (() => {
  try {
    return loadProjects();
  } catch (error) {
    logger.error('Failed to load projects from storage:', { component: 'projectsSlice', operation: 'failedLoadProjects' }, error as Error);
    return [];
  }
})();

const initialState: ProjectsState = {
  projects: initialProjects,
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject: {
      reducer: (state, action: PayloadAction<Project>) => {
        state.projects.push(action.payload);
      },
      prepare: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> | Project) => {
        // If the project already has an ID (pre-generated), use it as-is
        if ('id' in projectData && projectData.id) {
          return { payload: projectData as Project };
        }
        
        // Otherwise, generate ID and timestamps
        const newProject: Project = {
          ...projectData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return { payload: newProject };
      }
    },
    updateProject: (state, action: PayloadAction<Partial<Project> & { id: string }>) => {
      const index = state.projects.findIndex(project => project.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = {
          ...state.projects[index],
          ...action.payload,
          updatedAt: new Date(),
        };
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(project => project.id !== action.payload);
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addProject,
  updateProject,
  deleteProject,
  setProjects,
  setLoading: setProjectsLoading,
  setError: setProjectsError,
} = projectsSlice.actions;

export const selectAllProjects = (state: { projects: ProjectsState }) => state.projects.projects;
export const selectActiveProjects = (state: { projects: ProjectsState }) => 
  state.projects.projects.filter(project => !project.archived);
export const selectProjectsLoading = (state: { projects: ProjectsState }) => state.projects.loading;
export const selectProjectsError = (state: { projects: ProjectsState }) => state.projects.error;

export default projectsSlice.reducer;