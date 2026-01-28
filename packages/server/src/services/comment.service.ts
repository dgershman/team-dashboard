import { v4 as uuidv4 } from 'uuid';
import { getStore, saveStore } from '../db/store.js';
import type { Comment, CreateComment } from '../models/types.js';

export function createComment(data: CreateComment, userId?: string): Comment {
  const store = getStore();
  const now = new Date().toISOString();

  const comment: Comment = {
    id: uuidv4(),
    task_id: data.task_id,
    user_id: userId || null,
    content: data.content,
    is_automated: data.is_automated || false,
    created_at: now,
  };

  store.comments.push(comment);
  saveStore();

  return comment;
}

export function getComment(id: string): Comment | null {
  const store = getStore();
  return store.comments.find((c) => c.id === id) || null;
}

export function listComments(taskId: string): Comment[] {
  const store = getStore();
  return store.comments
    .filter((c) => c.task_id === taskId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getLatestComment(taskId: string): Comment | null {
  const store = getStore();
  const comments = store.comments.filter((c) => c.task_id === taskId);
  if (comments.length === 0) return null;
  // Return the last comment for this task (most recently added)
  return comments[comments.length - 1];
}

export function deleteComment(id: string): boolean {
  const store = getStore();
  const index = store.comments.findIndex((c) => c.id === id);
  if (index === -1) return false;

  store.comments.splice(index, 1);
  saveStore();
  return true;
}
