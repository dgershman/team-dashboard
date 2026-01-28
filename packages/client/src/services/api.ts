const API_BASE = '/api';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  team_id: string | null;
  role: 'admin' | 'member' | 'viewer';
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'P1' | 'P2' | 'P3';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  team_id: string;
  assignee_id: string | null;
  created_by_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  is_automated: boolean;
  created_at: string;
}

export interface TaskWithComments extends Task {
  comments: Comment[];
}

export interface KanbanBoard {
  not_started: Task[];
  in_progress: Task[];
  blocked: Task[];
  completed: Task[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  teams: {
    list: () => request<Team[]>('/teams'),
    get: (id: string) => request<Team>(`/teams/${id}`),
    create: (data: { name: string; description?: string }) =>
      request<Team>('/teams', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; description: string }>) =>
      request<Team>(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/teams/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: (teamId?: string) => request<User[]>(teamId ? `/users?team_id=${teamId}` : '/users'),
    get: (id: string) => request<User>(`/users/${id}`),
    create: (data: { email: string; name: string; team_id?: string; role?: string }) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ email: string; name: string; team_id: string; role: string }>) =>
      request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (filters?: { team_id?: string; assignee_id?: string; status?: TaskStatus }) => {
      const params = new URLSearchParams();
      if (filters?.team_id) params.set('team_id', filters.team_id);
      if (filters?.assignee_id) params.set('assignee_id', filters.assignee_id);
      if (filters?.status) params.set('status', filters.status);
      const query = params.toString();
      return request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<TaskWithComments>(`/tasks/${id}`),
    getKanban: (teamId: string) => request<KanbanBoard>(`/tasks/kanban/${teamId}`),
    create: (data: {
      team_id: string;
      title: string;
      description?: string;
      assignee_id?: string;
      priority?: TaskPriority;
      due_date?: string;
      created_by_id: string;
    }) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (
      id: string,
      data: Partial<{
        title: string;
        description: string | null;
        assignee_id: string | null;
        status: TaskStatus;
        priority: TaskPriority;
        due_date: string | null;
      }>
    ) => request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    addComment: (taskId: string, data: { content: string; user_id?: string; is_automated?: boolean }) =>
      request<Comment>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  },
};
