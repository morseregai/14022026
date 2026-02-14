import { Request, Response, NextFunction } from 'express';
import { supabaseAuth } from '../supabase';
import { upsertSession, touchSession } from '../localSessions';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await touchSession(token).catch(async () => upsertSession(token, user.id).catch(() => undefined));
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
