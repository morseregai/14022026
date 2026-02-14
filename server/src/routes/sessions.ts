import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.post('/create', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { modelId } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        model_id: modelId || 'xiaomi/mimo-v2-flash',
        title: 'New Chat'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Session create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  const user = (req as any).user;

  try {
    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Session fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/messages', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (sessionError || !session || session.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Messages fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
