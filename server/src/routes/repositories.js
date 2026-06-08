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

// ✅ Static routes MUST come before parameterized /:id routes
router.post('/import', importRepository);   // POST /api/repositories/import
router.get('/',        getRepositories);     // GET  /api/repositories

// Parameterized routes — always below static ones
router.get('/:id',          getRepository);      // GET  /api/repositories/:id
router.get('/:id/tree',     getRepositoryTree);  // GET  /api/repositories/:id/tree
router.get('/:id/file',     getRepositoryFile);  // GET  /api/repositories/:id/file?path=
router.delete('/:id',       deleteRepository);   // DELETE /api/repositories/:id

export default router;

