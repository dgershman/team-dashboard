import { Router } from 'express';
import * as teamService from '../services/team.service.js';
import { CreateTeamSchema } from '../models/types.js';

const router = Router();

router.get('/', (_req, res) => {
  const teams = teamService.listTeams();
  res.json(teams);
});

router.get('/:id', (req, res) => {
  const team = teamService.getTeam(req.params.id);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  res.json(team);
});

router.post('/', (req, res) => {
  try {
    const data = CreateTeamSchema.parse(req.body);
    const team = teamService.createTeam(data);
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request body' });
  }
});

router.patch('/:id', (req, res) => {
  const updated = teamService.updateTeam(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Team not found' });
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = teamService.deleteTeam(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Team not found' });
  }
  res.status(204).send();
});

export default router;
