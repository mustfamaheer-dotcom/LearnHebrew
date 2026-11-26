import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import * as controller from './shorts.controller';

const router = Router();

// Student / Public feed (authenticated, requires shorts:view)
router.get('/', authenticate, requirePermission('shorts:view'), controller.listShorts);

// Interaction & View tracking
router.post('/:id/interact', authenticate, requirePermission('shorts:view'), controller.interactWithShort);
router.post('/:id/view', authenticate, requirePermission('shorts:view'), controller.trackView);

// Admin Management Endpoints (requires shorts:manage)
router.get('/admin/all', authenticate, requirePermission('shorts:manage'), controller.listAdminShorts);
router.post('/', authenticate, requirePermission('shorts:manage'), controller.createShort);
router.put('/:id', authenticate, requirePermission('shorts:manage'), controller.updateShort);
router.delete('/:id', authenticate, requirePermission('shorts:manage'), controller.deleteShort);
router.post('/admin/reorder', authenticate, requirePermission('shorts:manage'), controller.reorderShorts);

export default router;
