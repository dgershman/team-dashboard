import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserRoleSchema = z.enum(['admin', 'member', 'viewer']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  team_id: z.string().uuid().nullable(),
  role: UserRoleSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const TaskStatusSchema = z.enum(['not_started', 'in_progress', 'blocked', 'completed']);
export const TaskPrioritySchema = z.enum(['P1', 'P2', 'P3']);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  team_id: z.string().uuid(),
  assignee_id: z.string().uuid().nullable(),
  created_by_id: z.string().uuid(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  due_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CommentSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  content: z.string().min(1),
  is_automated: z.boolean(),
  created_at: z.string(),
});

export type Team = z.infer<typeof TeamSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type Comment = z.infer<typeof CommentSchema>;

// Input schemas for creating/updating
export const CreateTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  team_id: z.string().uuid().optional(),
  role: UserRoleSchema.optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  team_id: z.string().uuid(),
  assignee_id: z.string().uuid().optional(),
  priority: TaskPrioritySchema.optional(),
  due_date: z.string().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  due_date: z.string().nullable().optional(),
});

export const CreateCommentSchema = z.object({
  task_id: z.string().uuid(),
  content: z.string().min(1),
  is_automated: z.boolean().optional(),
});

export type CreateTeam = z.infer<typeof CreateTeamSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type CreateComment = z.infer<typeof CreateCommentSchema>;
