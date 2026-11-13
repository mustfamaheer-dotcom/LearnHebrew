import { prisma } from '../../config/database';
import { getCachedOrFetch, cacheInvalidatePrefix } from '../../lib/cache';

export async function listRolesWithPermissions() {
  return getCachedOrFetch('rbac:matrix', 300, async () => {
    const roles = await prisma.roleDefinition.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    const permissions = await prisma.permission.findMany({
      orderBy: [{ group: 'asc' }, { code: 'asc' }],
    });
    return { roles, permissions };
  });
}

export async function createRole(data: {
  name: string;
  labelEn: string;
  labelHe: string;
  permissionIds: string[];
}) {
  const roleName = data.name.trim().toUpperCase().replace(/\s+/g, '_');
  const role = await prisma.roleDefinition.create({
    data: {
      name: roleName,
      labelEn: data.labelEn.trim(),
      labelHe: data.labelHe.trim(),
      isSystem: false,
      permissions: {
        create: data.permissionIds.map((pid) => ({
          permissionId: pid,
          granted: true,
        })),
      },
    },
    include: { permissions: true },
  });
  await cacheInvalidatePrefix('rbac:');
  return role;
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
) {
  const role = await prisma.roleDefinition.findUnique({ where: { id: roleId } });
  if (!role) throw { status: 404, message: 'Role not found' };

  // Transactionally replace role permissions
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissionIds.map((pid) => ({
        roleId,
        permissionId: pid,
        granted: true,
      })),
    }),
  ]);

  await cacheInvalidatePrefix('rbac:');
  return prisma.roleDefinition.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });
}

export async function deleteRole(roleId: string) {
  const role = await prisma.roleDefinition.findUnique({ where: { id: roleId } });
  if (!role) throw { status: 404, message: 'Role not found' };
  if (role.isSystem) {
    throw { status: 400, message: 'System protected roles cannot be deleted.' };
  }
  const assignedUsers = await prisma.user.count({ where: { roleDefinitionId: roleId } });
  if (assignedUsers > 0) {
    throw { status: 400, message: `Cannot delete: ${assignedUsers} users are currently assigned to this role.` };
  }
  await prisma.roleDefinition.delete({ where: { id: roleId } });
  await cacheInvalidatePrefix('rbac:');
  return { message: 'Role deleted successfully' };
}
