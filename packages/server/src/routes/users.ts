import { Router } from 'express';
import * as userService from '../services/user.service.js';
import { CreateUserSchema } from '../models/types.js';

const router = Router();

router.get('/', (req, res) => {
  const teamId = req.query.team_id as string | undefined;
  const users = userService.listUsers(teamId);
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = userService.getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.post('/', (req, res) => {
  try {
    const data = CreateUserSchema.parse(req.body);
    const user = userService.createUser(data);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body' });
  }
});

router.patch('/:id', (req, res) => {
  const updated = userService.updateUser(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = userService.deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.status(204).send();
});

export default router;
