import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.post('/', authenticateUser, async (req: any, res: any) => {
  const { modelId, history, currentParts, apiKey, sessionId } = req.body;
  const user = (req as any).user;

  if (!modelId || !currentParts) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const ratesByModel: Record<string, { inputRate: number; outputRate: number }> = {
      'google/gemini-3-flash-preview': { inputRate: 1 / 1_000_000, outputRate: 2 / 1_000_000 },
      'openai/gpt-4o-mini': { inputRate: 1 / 1_000_000, outputRate: 2 / 1_000_000 },
    };

    const { inputRate, outputRate } = ratesByModel[modelId] ?? {
      inputRate: 1 / 1_000_000,
      outputRate: 2 / 1_000_000,
    };

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('usd_balance')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(500).json({ error: 'Failed to fetch user balance' });
    }

    const minBalanceUsd = 0.001;
    const usdBalance = Number(userData.usd_balance);

    if (!Number.isFinite(usdBalance) || usdBalance <= minBalanceUsd) {
        return res.status(403).json({ error: 'Insufficient balance' });
    }

    const safeHistory = Array.isArray(history) ? history : [];
    const rawMessages = [
        ...safeHistory.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'assistant', 
            content: h.parts ? h.parts.map((p: any) => p.text).join('') : h.content
        })),
        {
            role: 'user',
            content: currentParts.map((p: any) => p.text).join('')
        }
    ];

    const maxPromptChars = 12000;
    const trimMessagesToChars = (arr: Array<{ role: string; content: string }>, maxChars: number) => {
      const out: Array<{ role: string; content: string }> = [];
      let total = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        const m = arr[i];
        const c = String(m?.content ?? '');
        const nextTotal = total + c.length;
        if (out.length > 0 && nextTotal > maxChars) break;
        out.unshift({ role: m.role, content: c });
        total = nextTotal;
        if (total >= maxChars) break;
      }
      return { messages: out, truncated: out.length !== arr.length, chars: total };
    };

    const trimmed = trimMessagesToChars(rawMessages as any, maxPromptChars);
    const messages = trimmed.messages;

    const estimateTokens = (chars: number) => Math.max(1, Math.ceil(chars / 4));
    const estimatedPromptTokens = estimateTokens(trimmed.chars);
    const safetyMultiplier = 1.2;
    const estimatedPromptCost = estimatedPromptTokens * inputRate;
    const remainingForOutput = (usdBalance - estimatedPromptCost) / safetyMultiplier;
    const budgetedMaxTokens = outputRate > 0 ? Math.floor(remainingForOutput / outputRate) : 0;
    const minMaxTokens = 32;
    const hardCapMaxTokens = 800;

    if (!Number.isFinite(budgetedMaxTokens) || budgetedMaxTokens < minMaxTokens) {
      return res.status(403).json({ error: 'Insufficient balance' });
    }

    const maxTokens = Math.max(minMaxTokens, Math.min(hardCapMaxTokens, budgetedMaxTokens));

    const openRouterKey = process.env.OPENROUTER_API_KEY || apiKey;
    
    if (!openRouterKey) {
        return res.status(500).json({ error: 'Server configuration error: No API Key' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ultichat-winter.com', 
            'X-Title': 'UltiChat Winter'
        },
        body: JSON.stringify({
            model: modelId,
            messages: messages,
            include_costs: true,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('OpenRouter Error:', errText);
        return res.status(response.status).json({ error: 'OpenRouter API error', details: errText });
    }

    const data: any = await response.json();
    const reply = data.choices[0].message.content;
    const usage = data.usage; 
    const finishReason = data?.choices?.[0]?.finish_reason;
    const limited = finishReason === 'length' || maxTokens < hardCapMaxTokens;

    let cost = 0;
    const providedCost = Number(data?.cost);
    if (Number.isFinite(providedCost) && providedCost >= 0) {
        cost = providedCost;
    } else if (usage) {
        cost = (usage.prompt_tokens * inputRate) + (usage.completion_tokens * outputRate);
    }

    let newBalance = Number.isFinite(usdBalance) ? usdBalance : 0;
    if (cost > 0) {
      const { data: updatedBalance, error: spendError } = await supabaseAdmin.rpc('spend_balance', {
        p_user_id: user.id,
        p_amount: cost,
        p_description: `Chat with ${modelId}`,
      });

      if (spendError) {
        if (String(spendError.message).includes('insufficient_balance')) {
          return res.status(403).json({ error: 'Insufficient balance' });
        }
        return res.status(500).json({ error: 'Failed to update balance' });
      }

      newBalance = updatedBalance;
    }

    if (sessionId) {
        await supabaseAdmin.from('messages').insert({
            session_id: sessionId,
            role: 'user',
            content: currentParts,
            tokens_used: usage?.prompt_tokens || 0
        });

        await supabaseAdmin.from('messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: [{ text: reply }],
            tokens_used: usage?.completion_tokens || 0,
            cost: cost
        });

        await supabaseAdmin
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
    }

    res.json({
        reply,
        usage,
        cost,
        balance: newBalance,
        limited,
        prompt_truncated: trimmed.truncated,
        max_tokens: maxTokens
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
