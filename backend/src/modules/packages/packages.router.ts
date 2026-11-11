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
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Public / Student Coupon Validation for package purchase & session checkout
router.post('/validate-coupon', validateCouponHandler);

// Package catalog & management
router.get('/', listPackagesHandler);
router.post('/grant-credits', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), grantCreditsHandler);
router.post('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), createPackageHandler);
router.patch('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), updatePackageHandler);
router.delete('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), deletePackageHandler);
router.post('/:id/assign', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), assignPackageHandler);

// Admin Coupon & Promotional Engine Management
router.get('/coupons/all', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), listCouponsHandler);
router.post('/coupons', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), createCouponHandler);
router.delete('/coupons/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), deleteCouponHandler);

export default router;

