import { Router } from 'express';
import {
  listPackagesHandler,
  createPackageHandler,
  updatePackageHandler,
  deletePackageHandler,
  assignPackageHandler,
  grantCreditsHandler,
} from './packages.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', listPackagesHandler);
router.post('/grant-credits', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), grantCreditsHandler);
router.post('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), createPackageHandler);
router.patch('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), updatePackageHandler);
router.delete('/:id', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), deletePackageHandler);
router.post('/:id/assign', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), assignPackageHandler);

export default router;

