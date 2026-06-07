import { Router } from 'express';
import {
  importRepository,
  getRepositories,
  getRepository,
  getRepositoryTree,
  getRepositoryFile,
  deleteRepository,
} from '../controllers/repoController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/import', importRepository);
router.get('/', getRepositories);
router.get('/:id', getRepository);
router.get('/:id/tree', getRepositoryTree);
router.get('/:id/file', getRepositoryFile);
router.delete('/:id', deleteRepository);

export default router;
