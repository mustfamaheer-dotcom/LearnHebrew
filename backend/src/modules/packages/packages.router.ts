import { Router } from 'express';
import {
  listPackagesHandler,
  createPackageHandler,
  updatePackageHandler,
  deletePackageHandler,
  assignPackageHandler,
  grantCreditsHandler,
  validateCouponHandler,
  listCouponsHandler,
  createCouponHandler,
  deleteCouponHandler,
} from './packages.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { Role } from '@prisma/client';

const router = Router();

// Public package catalog (Accessible on Landing Page and by unauthenticated visitors)
router.get('/', listPackagesHandler);

// Public / Student Coupon Validation for package purchase & session checkout
router.post('/validate-coupon', validateCouponHandler);

// Authenticated administrative & student actions
router.use(authenticate);

router.post('/grant-credits', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('students:adjust_balance'), grantCreditsHandler);
router.post('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('packages:create'), createPackageHandler);
router.patch('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('packages:edit'), updatePackageHandler);
router.delete('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('packages:delete'), deletePackageHandler);
router.post('/:id/assign', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.SALES), requirePermission('packages:assign'), assignPackageHandler);

// Admin Coupon & Promotional Engine Management
router.get('/coupons/all', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('packages:view'), listCouponsHandler);
router.post('/coupons', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('packages:create'), createCouponHandler);
router.delete('/coupons/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), requirePermission('packages:delete'), deleteCouponHandler);

export default router;

