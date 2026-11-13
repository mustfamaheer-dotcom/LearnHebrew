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
