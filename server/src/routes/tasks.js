import { Router } from 'express';
import { getTasks, getTask, deleteTask } from '../controllers/taskController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/', getTasks);
router.get('/:id', getTask);
router.delete('/:id', deleteTask);

export default router;
