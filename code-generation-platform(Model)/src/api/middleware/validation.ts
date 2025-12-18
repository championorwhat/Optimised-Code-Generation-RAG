import { Request, Response, NextFunction } from 'express';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  if (!req.body || typeof req.body.prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required in body' });
  }
  next();
}
