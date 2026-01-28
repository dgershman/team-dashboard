import { Router } from 'express';
import teamsRouter from './teams.js';
import usersRouter from './users.js';
import tasksRouter from './tasks.js';

const router = Router();

router.use('/teams', teamsRouter);
router.use('/users', usersRouter);
router.use('/tasks', tasksRouter);

export default router;
