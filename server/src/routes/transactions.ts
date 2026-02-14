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

router.post('/gift', authenticateUser, async (req: any, res: any) => {
  const user = (req as any).user;
  const { code } = req.body || {};

  if (code !== '16031958') {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const amount = 0.01;
  const description = 'Gift code';

  try {
    const { data: already, error: alreadyError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .eq('description', description)
      .limit(1);

    if (alreadyError) {
      return res.status(500).json({ error: alreadyError.message });
    }

    if (already && already.length > 0) {
      return res.status(400).json({ error: 'Already redeemed' });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('usd_balance')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(500).json({ error: 'Failed to fetch user balance' });
    }

    const current = Number(userData.usd_balance);
    const newBalance = (Number.isFinite(current) ? current : 0) + amount;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ usd_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      amount,
      type: 'deposit',
      description,
    });

    res.json({ balance: newBalance });
  } catch (err) {
    console.error('Gift redeem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
