"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProjectsError = exports.selectProjectsLoading = exports.selectActiveProjects = exports.selectAllProjects = exports.setProjectsError = exports.setProjectsLoading = exports.setProjects = exports.deleteProject = exports.updateProject = exports.addProject = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const utils_1 = require("../../utils");
const persistence_1 = require("../../utils/persistence");
// Load projects from localStorage on initialization
const initialProjects = (() => {
    try {
        return (0, persistence_1.loadProjects)();
    }
    catch (error) {
        console.error('Failed to load projects from storage:', error);
        return [];
    }
})();
const initialState = {
    projects: initialProjects,
    loading: false,
    error: null,
};
const projectsSlice = (0, toolkit_1.createSlice)({
    name: 'projects',
    initialState,
    reducers: {
        addProject: {
            reducer: (state, action) => {
                state.projects.push(action.payload);
            },
            prepare: (projectData) => {
                // If the project already has an ID (pre-generated), use it as-is
                if ('id' in projectData && projectData.id) {
                    return { payload: projectData };
                }
                // Otherwise, generate ID and timestamps
                const newProject = {
                    ...projectData,
                    id: (0, utils_1.generateId)(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                return { payload: newProject };
            }
        },
        updateProject: (state, action) => {
            const index = state.projects.findIndex(project => project.id === action.payload.id);
            if (index !== -1) {
                state.projects[index] = {
                    ...state.projects[index],
                    ...action.payload,
                    updatedAt: new Date(),
                };
            }
        },
        deleteProject: (state, action) => {
            state.projects = state.projects.filter(project => project.id !== action.payload);
        },
        setProjects: (state, action) => {
            state.projects = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});
_a = projectsSlice.actions, exports.addProject = _a.addProject, exports.updateProject = _a.updateProject, exports.deleteProject = _a.deleteProject, exports.setProjects = _a.setProjects, exports.setProjectsLoading = _a.setLoading, exports.setProjectsError = _a.setError;
const selectAllProjects = (state) => state.projects.projects;
exports.selectAllProjects = selectAllProjects;
const selectActiveProjects = (state) => state.projects.projects.filter(project => !project.archived);
exports.selectActiveProjects = selectActiveProjects;
const selectProjectsLoading = (state) => state.projects.loading;
exports.selectProjectsLoading = selectProjectsLoading;
const selectProjectsError = (state) => state.projects.error;
exports.selectProjectsError = selectProjectsError;
exports.default = projectsSlice.reducer;
