import { Request, Response } from 'express';
import * as service from './roles.service';

export async function getMatrix(req: Request, res: Response) {
  const data = await service.listRolesWithPermissions();
  res.json(data);
}

export async function createRole(req: Request, res: Response) {
  const role = await service.createRole(req.body);
  res.status(201).json(role);
}

export async function updatePermissions(req: Request, res: Response) {
  const updated = await service.updateRolePermissions(req.params.id, req.body.permissionIds);
  res.json(updated);
}

export async function deleteRole(req: Request, res: Response) {
  const result = await service.deleteRole(req.params.id);
  res.json(result);
}
