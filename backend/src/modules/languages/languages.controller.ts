import { Request, Response } from 'express';
import * as service from './languages.service';

export async function listLanguages(req: Request, res: Response) {
  const langs = await service.listLanguages();
  res.json(langs);
}

export async function createLanguage(req: Request, res: Response) {
  const lang = await service.createLanguage(req.body);
  res.status(201).json(lang);
}

export async function toggleLanguage(req: Request, res: Response) {
  const lang = await service.toggleLanguage(req.params.id, req.body.isActive);
  res.json(lang);
}

export async function updateLanguage(req: Request, res: Response) {
  const lang = await service.updateLanguage(req.params.id, req.body);
  res.json(lang);
}

export async function deleteLanguage(req: Request, res: Response) {
  await service.deleteLanguage(req.params.id);
  res.status(204).send();
}
