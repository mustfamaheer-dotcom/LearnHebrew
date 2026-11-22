import { app } from '../src/app';

export default function handler(req: any, res: any) {
  if (req.headers && req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  } else if (req.url) {
    if (req.url.startsWith('/backend/api/index')) {
      req.url = req.url.replace('/backend/api/index', '') || '/';
    } else if (req.url.startsWith('/api/index')) {
      req.url = req.url.replace('/api/index', '') || '/';
    }
  }

  return app(req, res);
}


