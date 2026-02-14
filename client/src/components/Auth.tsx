import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Languages, Moon, Snowflake, Sun } from 'lucide-react';
import { useAppSettings } from './AppSettingsProvider';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, locale, setLocale, theme, setTheme } = useAppSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isLogin 
        ? await api.auth.login({ email, password })
        : await api.auth.register({ email, password });
      
      localStorage.setItem('token', res.session.access_token);
      const storedUser = res.profile || res.user
      if (storedUser && typeof storedUser.usd_balance === 'string') {
        storedUser.usd_balance = Number(storedUser.usd_balance)
      }
      localStorage.setItem('user', JSON.stringify(storedUser));
      window.dispatchEvent(new Event('user-updated'))
      
      navigate('/profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md p-8 bg-[var(--panel)] rounded-lg shadow-xl border border-[var(--border)] relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center bg-[var(--panel-2)] hover:bg-[var(--panel-2)]/80 border border-[var(--border)] rounded-lg w-10 h-10 transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
            className="flex items-center gap-2 bg-[var(--panel-2)] hover:bg-[var(--panel-2)]/80 border border-[var(--border)] rounded-lg px-3 h-10 text-sm transition"
            aria-label="Toggle language"
          >
            <Languages className="w-4 h-4" />
            <span className="font-medium">{locale.toUpperCase()}</span>
          </button>
        </div>
        <div className="flex justify-center mb-3">
          <Snowflake className="w-8 h-8 text-blue-300" />
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
          {isLogin ? t('welcomeBack') : t('createAccount')}
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-[var(--muted)] w-5 h-5" />
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded p-2 pl-10 focus:outline-none focus:border-blue-500 text-[var(--text)] placeholder-[var(--muted)]"
              required
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-[var(--muted)] w-5 h-5" />
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded p-2 pl-10 focus:outline-none focus:border-blue-500 text-[var(--text)] placeholder-[var(--muted)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2"
          >
            {loading ? t('processing') : (isLogin ? t('signIn') : t('signUp'))}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="mt-4 text-center text-[var(--muted)] text-sm">
          {isLogin ? `${t('dontHaveAccount')} ` : `${t('alreadyHaveAccount')} `}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:underline"
          >
            {isLogin ? t('signUp') : t('signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}
