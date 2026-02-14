import { Router } from 'express';
import { supabaseAdmin, supabaseAuth } from '../supabase';
import { upsertSession } from '../localSessions';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/me', authenticateUser, async (req: any, res) => {
  const user = (req as any).user;

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id,email,usd_balance,last_login,created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ user, profile });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      return res.status(400).json({ error: 'User created but failed to sign in automatically' });
    }

    const token = signInData.session?.access_token;
    if (token) await upsertSession(token, user.id).catch(() => undefined);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update last_login:', updateError);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id,email,usd_balance,last_login,created_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    res.json({ user, session: signInData.session, profile });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    if (data.user) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      if (updateError) {
        console.error('Failed to update last_login:', updateError);
      }
    }

    const token = data.session?.access_token;
    if (token && data.user) await upsertSession(token, data.user.id).catch(() => undefined);

    const { data: profile, error: profileError } = data.user
      ? await supabaseAdmin
          .from('users')
          .select('id,email,usd_balance,last_login,created_at')
          .eq('id', data.user.id)
          .single()
      : { data: null as any, error: null as any };

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    res.json({ user: data.user, session: data.session, profile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
