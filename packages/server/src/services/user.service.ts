import { v4 as uuidv4 } from 'uuid';
import { getStore, saveStore } from '../db/store.js';
import type { User, CreateUser } from '../models/types.js';

export function createUser(data: CreateUser): User {
  const store = getStore();
  const now = new Date().toISOString();

  const user: User = {
    id: uuidv4(),
    email: data.email,
    name: data.name,
    team_id: data.team_id || null,
    role: data.role || 'member',
    created_at: now,
    updated_at: now,
  };

  store.users.push(user);
  saveStore();

  return user;
}

export function getUser(id: string): User | null {
  const store = getStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;
  const { ...rest } = user;
  return rest;
}

export function getUserByEmail(email: string): User | null {
  const store = getStore();
  const user = store.users.find((u) => u.email === email);
  if (!user) return null;
  const { ...rest } = user;
  return rest;
}

export function listUsers(teamId?: string): User[] {
  const store = getStore();
  let users = store.users;
  if (teamId) {
    users = users.filter((u) => u.team_id === teamId);
  }
  return users
    .map((u) => {
      const { ...rest } = u;
      return rest;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function updateUser(id: string, data: Partial<CreateUser>): User | null {
  const store = getStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return null;

  if (data.email !== undefined) user.email = data.email;
  if (data.name !== undefined) user.name = data.name;
  if (data.team_id !== undefined) user.team_id = data.team_id || null;
  if (data.role !== undefined) user.role = data.role;
  user.updated_at = new Date().toISOString();

  saveStore();

  const { ...rest } = user;
  return rest;
}

export function deleteUser(id: string): boolean {
  const store = getStore();
  const index = store.users.findIndex((u) => u.id === id);
  if (index === -1) return false;

  store.users.splice(index, 1);
  saveStore();
  return true;
}
