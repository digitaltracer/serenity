import { Project } from '../../types';
export interface ProjectsState {
    projects: Project[];
    loading: boolean;
    error: string | null;
}
export declare const addProject: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[projectData: Project | Omit<Project, "id" | "createdAt" | "updatedAt">], Project, "projects/addProject", never, never>, updateProject: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<Project> & {
    id: string;
}, "projects/updateProject">, deleteProject: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "projects/deleteProject">, setProjects: import("@reduxjs/toolkit").ActionCreatorWithPayload<Project[], "projects/setProjects">, setProjectsLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "projects/setLoading">, setProjectsError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "projects/setError">;
export declare const selectAllProjects: (state: {
    projects: ProjectsState;
}) => Project[];
export declare const selectActiveProjects: (state: {
    projects: ProjectsState;
}) => Project[];
export declare const selectProjectsLoading: (state: {
    projects: ProjectsState;
}) => boolean;
export declare const selectProjectsError: (state: {
    projects: ProjectsState;
}) => string | null;
declare const _default: import("redux").Reducer<ProjectsState>;
export default _default;
