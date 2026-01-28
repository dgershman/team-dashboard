import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as taskService from '../services/task.service.js';
import * as commentService from '../services/comment.service.js';
import * as userService from '../services/user.service.js';
import * as teamService from '../services/team.service.js';
import { initializeStore } from '../db/store.js';

const server = new Server(
  {
    name: 'team-dashboard',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool schemas
const ListTeamTasksSchema = z.object({
  team_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'completed']).optional(),
  assignee_id: z.string().uuid().optional(),
});

const GetTaskDetailsSchema = z.object({
  task_id: z.string().uuid(),
});

const UpdateTaskStatusSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'completed']),
});

const AddTaskCommentSchema = z.object({
  task_id: z.string().uuid(),
  content: z.string().min(1),
  is_automated: z.boolean().optional(),
});

const AssignTaskSchema = z.object({
  task_id: z.string().uuid(),
  assignee_id: z.string().uuid(),
});

const CreateTaskSchema = z.object({
  team_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  due_date: z.string().optional(),
  created_by_id: z.string().uuid(),
});

const GetKanbanSchema = z.object({
  team_id: z.string().uuid(),
});

const ListTeamMembersSchema = z.object({
  team_id: z.string().uuid(),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_team_tasks',
        description: 'Get all tasks for a team, optionally filtered by status or assignee',
        inputSchema: {
          type: 'object',
          properties: {
            team_id: { type: 'string', description: 'The team ID' },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'blocked', 'completed'],
              description: 'Filter by status',
            },
            assignee_id: { type: 'string', description: 'Filter by assignee' },
          },
          required: ['team_id'],
        },
      },
      {
        name: 'get_task_details',
        description: 'Get a task with its comments and full details',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'The task ID' },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'update_task_status',
        description: 'Change the status of a task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'The task ID' },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'blocked', 'completed'],
              description: 'The new status',
            },
          },
          required: ['task_id', 'status'],
        },
      },
      {
        name: 'add_task_comment',
        description: 'Add a comment or status update to a task',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'The task ID' },
            content: { type: 'string', description: 'The comment content' },
            is_automated: {
              type: 'boolean',
              description: 'Whether this is an automated comment from an agent',
            },
          },
          required: ['task_id', 'content'],
        },
      },
      {
        name: 'assign_task',
        description: 'Assign a task to a team member',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'The task ID' },
            assignee_id: { type: 'string', description: 'The user ID to assign the task to' },
          },
          required: ['task_id', 'assignee_id'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task for the team',
        inputSchema: {
          type: 'object',
          properties: {
            team_id: { type: 'string', description: 'The team ID' },
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            assignee_id: { type: 'string', description: 'User to assign the task to' },
            priority: { type: 'string', enum: ['P1', 'P2', 'P3'], description: 'Priority level' },
            due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
            created_by_id: { type: 'string', description: 'User creating the task' },
          },
          required: ['team_id', 'title', 'created_by_id'],
        },
      },
      {
        name: 'get_kanban',
        description: 'Get tasks organized by status (kanban board view)',
        inputSchema: {
          type: 'object',
          properties: {
            team_id: { type: 'string', description: 'The team ID' },
          },
          required: ['team_id'],
        },
      },
      {
        name: 'list_team_members',
        description: 'List all members of a team',
        inputSchema: {
          type: 'object',
          properties: {
            team_id: { type: 'string', description: 'The team ID' },
          },
          required: ['team_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_team_tasks': {
        const parsed = ListTeamTasksSchema.parse(args);
        const tasks = taskService.listTasks({
          teamId: parsed.team_id,
          status: parsed.status,
          assigneeId: parsed.assignee_id,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }],
        };
      }

      case 'get_task_details': {
        const parsed = GetTaskDetailsSchema.parse(args);
        const task = taskService.getTask(parsed.task_id);
        if (!task) {
          return {
            content: [{ type: 'text', text: 'Task not found' }],
            isError: true,
          };
        }
        const comments = commentService.listComments(parsed.task_id);
        const assignee = task.assignee_id ? userService.getUser(task.assignee_id) : null;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ...task, comments, assignee }, null, 2),
            },
          ],
        };
      }

      case 'update_task_status': {
        const parsed = UpdateTaskStatusSchema.parse(args);
        const updated = taskService.updateTask(parsed.task_id, { status: parsed.status });
        if (!updated) {
          return {
            content: [{ type: 'text', text: 'Task not found' }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: `Task status updated to ${parsed.status}` }],
        };
      }

      case 'add_task_comment': {
        const parsed = AddTaskCommentSchema.parse(args);
        const comment = commentService.createComment({
          task_id: parsed.task_id,
          content: parsed.content,
          is_automated: parsed.is_automated,
        });
        return {
          content: [{ type: 'text', text: `Comment added with ID: ${comment.id}` }],
        };
      }

      case 'assign_task': {
        const parsed = AssignTaskSchema.parse(args);
        const updated = taskService.updateTask(parsed.task_id, { assignee_id: parsed.assignee_id });
        if (!updated) {
          return {
            content: [{ type: 'text', text: 'Task not found' }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: `Task assigned to user ${parsed.assignee_id}` }],
        };
      }

      case 'create_task': {
        const parsed = CreateTaskSchema.parse(args);
        const task = taskService.createTask(
          {
            team_id: parsed.team_id,
            title: parsed.title,
            description: parsed.description,
            assignee_id: parsed.assignee_id,
            priority: parsed.priority,
            due_date: parsed.due_date,
          },
          parsed.created_by_id
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
        };
      }

      case 'get_kanban': {
        const parsed = GetKanbanSchema.parse(args);
        const kanban = taskService.getTasksByStatus(parsed.team_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(kanban, null, 2) }],
        };
      }

      case 'list_team_members': {
        const parsed = ListTeamMembersSchema.parse(args);
        const members = userService.listUsers(parsed.team_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(members, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

export async function startMcpServer() {
  initializeStore();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Team Dashboard MCP Server running on stdio');
}
