import { v4 as uuidv4 } from 'uuid';
import { getStore, saveStore } from '../db/store.js';
import type { Team, CreateTeam } from '../models/types.js';

export function createTeam(data: CreateTeam): Team {
  const store = getStore();
  const now = new Date().toISOString();

  const team: Team = {
    id: uuidv4(),
    name: data.name,
    description: data.description || null,
    created_at: now,
    updated_at: now,
  };

  store.teams.push(team);
  saveStore();

  return team;
}

export function getTeam(id: string): Team | null {
  const store = getStore();
  return store.teams.find((t) => t.id === id) || null;
}

export function listTeams(): Team[] {
  const store = getStore();
  return [...store.teams].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function updateTeam(id: string, data: Partial<CreateTeam>): Team | null {
  const store = getStore();
  const team = store.teams.find((t) => t.id === id);
  if (!team) return null;

  if (data.name !== undefined) team.name = data.name;
  if (data.description !== undefined) team.description = data.description || null;
  team.updated_at = new Date().toISOString();

  saveStore();
  return team;
}

export function deleteTeam(id: string): boolean {
  const store = getStore();
  const index = store.teams.findIndex((t) => t.id === id);
  if (index === -1) return false;

  store.teams.splice(index, 1);
  saveStore();
  return true;
}
