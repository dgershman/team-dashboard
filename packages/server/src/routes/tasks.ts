import { Router } from 'express';
import * as taskService from '../services/task.service.js';
import * as commentService from '../services/comment.service.js';
import { CreateTaskSchema, UpdateTaskSchema, CreateCommentSchema } from '../models/types.js';
import type { TaskStatus } from '../models/types.js';

const router = Router();

router.get('/', (req, res) => {
  const options: taskService.ListTasksOptions = {};
  if (req.query.team_id) options.teamId = req.query.team_id as string;
  if (req.query.assignee_id) options.assigneeId = req.query.assignee_id as string;
  if (req.query.status) options.status = req.query.status as TaskStatus;
  if (req.query.priority) options.priority = req.query.priority as 'P1' | 'P2' | 'P3';

  const tasks = taskService.listTasks(options);
  res.json(tasks);
});

router.get('/kanban/:teamId', (req, res) => {
  const kanban = taskService.getTasksByStatus(req.params.teamId);
  res.json(kanban);
});

router.get('/:id', (req, res) => {
  const task = taskService.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const comments = commentService.listComments(req.params.id);
  res.json({ ...task, comments });
});

router.post('/', (req, res) => {
  try {
    const data = CreateTaskSchema.parse(req.body);
    // In a real app, createdById would come from auth middleware
    const createdById = req.body.created_by_id || req.headers['x-user-id'] as string;
    if (!createdById) {
      return res.status(400).json({ error: 'created_by_id is required' });
    }
    const task = taskService.createTask(data, createdById);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const data = UpdateTaskSchema.parse(req.body);
    const updated = taskService.updateTask(req.params.id, data);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body' });
  }
});

router.delete('/:id', (req, res) => {
  const deleted = taskService.deleteTask(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).send();
});

// Comments
router.get('/:id/comments', (req, res) => {
  const comments = commentService.listComments(req.params.id);
  res.json(comments);
});

router.post('/:id/comments', (req, res) => {
  try {
    const data = CreateCommentSchema.parse({ ...req.body, task_id: req.params.id });
    const userId = req.body.user_id || req.headers['x-user-id'] as string;
    const comment = commentService.createComment(data, userId);
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body' });
  }
});

export default router;
