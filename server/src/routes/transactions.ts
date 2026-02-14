import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.get('/spend', authenticateUser, async (req: any, res: any) => {
  const user = (req as any).user;
  const rawLimit = Number(req.query?.limit);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, rawLimit)) : 10;

  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('amount,type,description,created_at')
      .eq('user_id', user.id)
      .eq('type', 'spend')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const items = (data || []).map((t: any) => {
      const desc = typeof t.description === 'string' ? t.description : '';
      const modelMatch = desc.match(/^Chat with\s+(.+)$/i);
      const model = modelMatch ? modelMatch[1].trim() : desc;
      return {
        created_at: t.created_at,
        model,
        amount: t.amount,
      };
    });

    res.json(items);
  } catch (err) {
    console.error('Transactions fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

