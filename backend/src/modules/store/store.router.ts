import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRoles } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import * as controller from './store.controller';

const router = Router();

// All store endpoints require authentication
router.use(authenticate);

// Catalog & item detail
router.get('/items', controller.listItems);
router.get('/items/:id', controller.getItem);

// Student endpoints
router.get('/my-coins', requireRoles(Role.STUDENT), controller.getMyCoins);
router.get('/my-inventory', requireRoles(Role.STUDENT), controller.getMyInventory);
router.post('/redeem', requireRoles(Role.STUDENT), controller.redeemItem);
router.post('/equip', requireRoles(Role.STUDENT), controller.equipItem);

// Admin / RBAC-gated endpoints
router.post('/items', requirePermission('store:manage_items'), controller.createItem);
router.put('/items/:id', requirePermission('store:manage_items'), controller.updateItem);
router.delete('/items/:id', requirePermission('store:manage_items'), controller.deleteItem);

router.post('/grant-coins', requirePermission('store:grant_coins'), controller.grantCoins);

router.get('/transactions', requirePermission('store:view_transactions'), controller.listTransactions);
router.get('/transactions/:studentId', requirePermission('store:view_transactions'), controller.getStudentTransactions);

export default router;
