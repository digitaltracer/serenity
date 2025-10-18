import type { PersistenceClient, PersistenceStats } from './PersistenceClient';
import type { Task, Project, JournalEntry, Goal } from '../types';

interface WebApiClientOptions {
  baseUrl: string;
  getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
}

export class WebApiPersistenceClient implements PersistenceClient {
  private baseUrl: string;
  private getAuthHeaders?: WebApiClientOptions['getAuthHeaders'];

  constructor(options: WebApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getAuthHeaders = options.getAuthHeaders;
  }

  async initialize(): Promise<void> {
    // no-op for now; later we can fetch capabilities or warm caches
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof this.getAuthHeaders === 'function' ? await this.getAuthHeaders() : {}),
    };
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers, credentials: 'include' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  }

  tasks = {
    list: async (): Promise<Task[]> => {
      return this.request<Task[]>('/tasks');
    },
    create: async (input: Partial<Task> & Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      return this.request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) });
    },
    update: async (id: string, updates: Partial<Task>): Promise<Task> => {
      return this.request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    remove: async (id: string): Promise<void> => {
      await this.request<void>(`/tasks/${id}`, { method: 'DELETE' });
    },
  };

  projects = {
    list: async (): Promise<Project[]> => this.request<Project[]>('/projects'),
    create: async (input: Partial<Project> & Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
      return this.request<Project>('/projects', { method: 'POST', body: JSON.stringify(input) });
    },
    update: async (id: string, updates: Partial<Project>): Promise<Project> => {
      return this.request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    remove: async (id: string): Promise<void> => {
      await this.request<void>(`/projects/${id}`, { method: 'DELETE' });
    },
  };

  journal = {
    list: async (): Promise<JournalEntry[]> => this.request<JournalEntry[]>('/journal'),
    create: async (input: Partial<JournalEntry> & Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> => {
      return this.request<JournalEntry>('/journal', { method: 'POST', body: JSON.stringify(input) });
    },
    update: async (id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> => {
      return this.request<JournalEntry>(`/journal/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    remove: async (id: string): Promise<void> => {
      await this.request<void>(`/journal/${id}`, { method: 'DELETE' });
    },
  };

  goals = {
    list: async (): Promise<Goal[]> => this.request<Goal[]>('/goals'),
    create: async (input: Partial<Goal> & Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
      return this.request<Goal>('/goals', { method: 'POST', body: JSON.stringify(input) });
    },
    update: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
      return this.request<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    remove: async (id: string): Promise<void> => {
      await this.request<void>(`/goals/${id}`, { method: 'DELETE' });
    },
  };

  stats = {
    get: async (): Promise<PersistenceStats> => this.request<PersistenceStats>('/stats'),
  };
}




