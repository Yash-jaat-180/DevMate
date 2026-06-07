import { Router } from 'express';
import {
  analyzeRepository,
  chatAboutRepo,
  suggestImprovements,
  generateFeature,
} from '../controllers/aiController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/analyze', analyzeRepository);
router.post('/chat', chatAboutRepo);
router.post('/suggestions', suggestImprovements);
router.post('/generate-feature', generateFeature);

export default router;
