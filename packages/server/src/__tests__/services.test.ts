import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { useInMemoryStore } from '../db/store.js';
import * as teamService from '../services/team.service.js';
import * as userService from '../services/user.service.js';
import * as taskService from '../services/task.service.js';
import * as commentService from '../services/comment.service.js';

beforeAll(() => {
  useInMemoryStore();
});

describe('Team Service', () => {
  beforeEach(() => {
    useInMemoryStore();
  });

  it('should create a team', () => {
    const team = teamService.createTeam({ name: 'Test Team', description: 'A test team' });
    expect(team.name).toBe('Test Team');
    expect(team.description).toBe('A test team');
    expect(team.id).toBeDefined();
  });

  it('should list teams', () => {
    teamService.createTeam({ name: 'Team 1' });
    teamService.createTeam({ name: 'Team 2' });
    const teams = teamService.listTeams();
    expect(teams.length).toBe(2);
  });

  it('should get a team by id', () => {
    const created = teamService.createTeam({ name: 'Get Test' });
    const team = teamService.getTeam(created.id);
    expect(team).toBeDefined();
    expect(team?.name).toBe('Get Test');
  });

  it('should update a team', () => {
    const created = teamService.createTeam({ name: 'Update Test' });
    const updated = teamService.updateTeam(created.id, { name: 'Updated Name' });
    expect(updated?.name).toBe('Updated Name');
  });

  it('should delete a team', () => {
    const created = teamService.createTeam({ name: 'Delete Test' });
    const deleted = teamService.deleteTeam(created.id);
    expect(deleted).toBe(true);
    const team = teamService.getTeam(created.id);
    expect(team).toBeNull();
  });
});

describe('User Service', () => {
  let teamId: string;

  beforeEach(() => {
    useInMemoryStore();
    const team = teamService.createTeam({ name: 'User Test Team' });
    teamId = team.id;
  });

  it('should create a user', () => {
    const user = userService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      team_id: teamId,
    });
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.team_id).toBe(teamId);
    expect(user.role).toBe('member');
  });

  it('should get user by email', () => {
    userService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      team_id: teamId,
    });
    const user = userService.getUserByEmail('test@example.com');
    expect(user).toBeDefined();
    expect(user?.name).toBe('Test User');
  });

  it('should list users by team', () => {
    userService.createUser({
      email: 'test1@example.com',
      name: 'Test User 1',
      team_id: teamId,
    });
    userService.createUser({
      email: 'test2@example.com',
      name: 'Test User 2',
      team_id: teamId,
    });
    const users = userService.listUsers(teamId);
    expect(users.length).toBe(2);
  });
});

describe('Task Service', () => {
  let teamId: string;
  let userId: string;

  beforeEach(() => {
    useInMemoryStore();
    const team = teamService.createTeam({ name: 'Task Test Team' });
    teamId = team.id;
    const user = userService.createUser({
      email: 'task-test@example.com',
      name: 'Task Tester',
      team_id: teamId,
    });
    userId = user.id;
  });

  it('should create a task', () => {
    const task = taskService.createTask(
      {
        team_id: teamId,
        title: 'Test Task',
        description: 'A test task',
        priority: 'P1',
      },
      userId
    );
    expect(task.title).toBe('Test Task');
    expect(task.priority).toBe('P1');
    expect(task.status).toBe('not_started');
  });

  it('should update task status', () => {
    const task = taskService.createTask({ team_id: teamId, title: 'Status Test' }, userId);
    const updated = taskService.updateTask(task.id, { status: 'in_progress' });
    expect(updated?.status).toBe('in_progress');
  });

  it('should get tasks by status (kanban)', () => {
    taskService.createTask({ team_id: teamId, title: 'Task 1' }, userId);
    taskService.createTask({ team_id: teamId, title: 'Task 2' }, userId);
    const kanban = taskService.getTasksByStatus(teamId);
    expect(kanban.not_started).toBeDefined();
    expect(kanban.in_progress).toBeDefined();
    expect(kanban.blocked).toBeDefined();
    expect(kanban.completed).toBeDefined();
    expect(kanban.not_started.length).toBe(2);
  });

  it('should filter tasks', () => {
    const task = taskService.createTask({ team_id: teamId, title: 'Filter Test' }, userId);
    taskService.updateTask(task.id, { status: 'in_progress' });
    const tasks = taskService.listTasks({ teamId, status: 'in_progress' });
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBe(1);
  });
});

describe('Comment Service', () => {
  let taskId: string;
  let userId: string;

  beforeEach(() => {
    useInMemoryStore();
    const team = teamService.createTeam({ name: 'Comment Test Team' });
    const user = userService.createUser({
      email: 'comment-test@example.com',
      name: 'Comment Tester',
      team_id: team.id,
    });
    userId = user.id;
    const task = taskService.createTask({ team_id: team.id, title: 'Comment Test Task' }, userId);
    taskId = task.id;
  });

  it('should create a comment', () => {
    const comment = commentService.createComment(
      { task_id: taskId, content: 'Test comment' },
      userId
    );
    expect(comment.content).toBe('Test comment');
    expect(comment.is_automated).toBe(false);
  });

  it('should create an automated comment', () => {
    const comment = commentService.createComment(
      { task_id: taskId, content: 'Automated update', is_automated: true },
      undefined
    );
    expect(comment.is_automated).toBe(true);
    expect(comment.user_id).toBeNull();
  });

  it('should list comments for a task', () => {
    commentService.createComment({ task_id: taskId, content: 'Comment 1' }, userId);
    commentService.createComment({ task_id: taskId, content: 'Comment 2' }, userId);
    const comments = commentService.listComments(taskId);
    expect(comments.length).toBe(2);
  });

  it('should get latest comment', () => {
    commentService.createComment({ task_id: taskId, content: 'First' }, userId);
    commentService.createComment({ task_id: taskId, content: 'Second' }, userId);
    const latest = commentService.getLatestComment(taskId);
    expect(latest).toBeDefined();
    expect(latest?.content).toBe('Second');
  });
});
