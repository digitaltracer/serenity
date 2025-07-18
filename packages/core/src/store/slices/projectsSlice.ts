import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types';
import { generateId } from '../../utils';

export interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject: (state, action: PayloadAction<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newProject: Project = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.projects.push(newProject);
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