import { Router } from 'express';
import {
  listHomeworkHandler,
  createHomeworkHandler,
  submitHomeworkHandler,
  reviewHomeworkHandler,
} from './homework.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listHomeworkHandler);
router.post('/', createHomeworkHandler);
router.patch('/:id/submit', submitHomeworkHandler);
router.patch('/:id/review', reviewHomeworkHandler);

export default router;

