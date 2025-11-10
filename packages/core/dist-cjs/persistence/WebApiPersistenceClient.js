"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebApiPersistenceClient = void 0;
class WebApiPersistenceClient {
    constructor(options) {
        this.tasks = {
            list: async () => {
                return this.request('/tasks');
            },
            create: async (input) => {
                return this.request('/tasks', { method: 'POST', body: JSON.stringify(input) });
            },
            update: async (id, updates) => {
                return this.request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
            },
            remove: async (id) => {
                await this.request(`/tasks/${id}`, { method: 'DELETE' });
            },
        };
        this.projects = {
            list: async () => this.request('/projects'),
            create: async (input) => {
                return this.request('/projects', { method: 'POST', body: JSON.stringify(input) });
            },
            update: async (id, updates) => {
                return this.request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
            },
            remove: async (id) => {
                await this.request(`/projects/${id}`, { method: 'DELETE' });
            },
        };
        this.journal = {
            list: async () => this.request('/journal'),
            create: async (input) => {
                return this.request('/journal', { method: 'POST', body: JSON.stringify(input) });
            },
            update: async (id, updates) => {
                return this.request(`/journal/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
            },
            remove: async (id) => {
                await this.request(`/journal/${id}`, { method: 'DELETE' });
            },
        };
        this.goals = {
            list: async () => this.request('/goals'),
            create: async (input) => {
                return this.request('/goals', { method: 'POST', body: JSON.stringify(input) });
            },
            update: async (id, updates) => {
                return this.request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
            },
            remove: async (id) => {
                await this.request(`/goals/${id}`, { method: 'DELETE' });
            },
        };
        this.stats = {
            get: async () => this.request('/stats'),
        };
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.getAuthHeaders = options.getAuthHeaders;
    }
    async initialize() {
        // no-op for now; later we can fetch capabilities or warm caches
    }
    async request(path, init) {
        const headers = {
            'Content-Type': 'application/json',
            ...(typeof this.getAuthHeaders === 'function' ? await this.getAuthHeaders() : {}),
        };
        const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers, credentials: 'include' });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        return (await res.json());
    }
}
exports.WebApiPersistenceClient = WebApiPersistenceClient;
