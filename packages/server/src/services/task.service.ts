import { v4 as uuidv4 } from 'uuid';
import { getStore, saveStore } from '../db/store.js';
import type { Task, CreateTask, UpdateTask, TaskStatus } from '../models/types.js';

const PRIORITY_ORDER = { P1: 1, P2: 2, P3: 3 };

function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function createTask(data: CreateTask, createdById: string): Task {
  const store = getStore();
  const now = new Date().toISOString();

  const task: Task = {
    id: uuidv4(),
    title: data.title,
    description: data.description || null,
    team_id: data.team_id,
    assignee_id: data.assignee_id || null,
    created_by_id: createdById,
    status: 'not_started',
    priority: data.priority || 'P3',
    due_date: data.due_date || null,
    created_at: now,
    updated_at: now,
  };

  store.tasks.push(task);
  saveStore();

  return task;
}

export function getTask(id: string): Task | null {
  const store = getStore();
  return store.tasks.find((t) => t.id === id) || null;
}

export interface ListTasksOptions {
  teamId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: 'P1' | 'P2' | 'P3';
}

export function listTasks(options: ListTasksOptions = {}): Task[] {
  const store = getStore();
  let tasks = [...store.tasks];

  if (options.teamId) {
    tasks = tasks.filter((t) => t.team_id === options.teamId);
  }
  if (options.assigneeId) {
    tasks = tasks.filter((t) => t.assignee_id === options.assigneeId);
  }
  if (options.status) {
    tasks = tasks.filter((t) => t.status === options.status);
  }
  if (options.priority) {
    tasks = tasks.filter((t) => t.priority === options.priority);
  }

  return sortTasks(tasks);
}

export function getTasksByStatus(teamId: string): { [key in TaskStatus]: Task[] } {
  const store = getStore();
  const tasks = sortTasks(store.tasks.filter((t) => t.team_id === teamId));

  return {
    not_started: tasks.filter((t) => t.status === 'not_started'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    blocked: tasks.filter((t) => t.status === 'blocked'),
    completed: tasks.filter((t) => t.status === 'completed'),
  };
}

export function updateTask(id: string, data: UpdateTask): Task | null {
  const store = getStore();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;

  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.assignee_id !== undefined) task.assignee_id = data.assignee_id;
  if (data.status !== undefined) task.status = data.status;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.due_date !== undefined) task.due_date = data.due_date;
  task.updated_at = new Date().toISOString();

  saveStore();
  return task;
}

export function deleteTask(id: string): boolean {
  const store = getStore();
  const index = store.tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;

  store.tasks.splice(index, 1);
  // Also delete related comments
  store.comments = store.comments.filter((c) => c.task_id !== id);
  saveStore();
  return true;
}
