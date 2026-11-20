import { Router } from 'express';
import * as controller from './review-links.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/redeem/:token', controller.redeemLink); // Public validation & access
router.post('/submit/:token', controller.submitReview); // Public verified review submission
router.get('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.listLinks);
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.createLink);
router.delete('/:id', authenticate, requireRoles(Role.SUPER_ADMIN, Role.ADMIN), controller.deleteLink);

export default router;
