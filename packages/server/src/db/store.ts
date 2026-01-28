import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Team, User, Task, Comment } from '../models/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Store {
  teams: Team[];
  users: (User & { password_hash?: string })[];
  tasks: Task[];
  comments: Comment[];
}

let store: Store = {
  teams: [],
  users: [],
  tasks: [],
  comments: [],
};

let dataPath: string;
let initialized = false;

export function initializeStore(customPath?: string): void {
  if (initialized && !customPath) return;

  const dataDir = customPath || path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  dataPath = path.join(dataDir, 'store.json');

  if (fs.existsSync(dataPath)) {
    try {
      const data = fs.readFileSync(dataPath, 'utf-8');
      store = JSON.parse(data);
    } catch {
      store = { teams: [], users: [], tasks: [], comments: [] };
    }
  }

  initialized = true;
}

export function saveStore(): void {
  if (!dataPath) return;
  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

export function getStore(): Store {
  if (!initialized) {
    initializeStore();
  }
  return store;
}

export function resetStore(): void {
  store = { teams: [], users: [], tasks: [], comments: [] };
  if (dataPath) {
    saveStore();
  }
}

// For testing - allow in-memory only mode
export function useInMemoryStore(): void {
  store = { teams: [], users: [], tasks: [], comments: [] };
  initialized = true;
  dataPath = '';
}
