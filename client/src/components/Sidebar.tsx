import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ArrowLeft, MessageSquare, User, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from './AppSettingsProvider';

interface SidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string, modelId?: string) => void;
  selectedModel: string;
}

export default function Sidebar({
  currentSessionId,
  onSelectSession,
  selectedModel
}: SidebarProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { t, locale } = useAppSettings();

  useEffect(() => {
    loadSessions();
  }, [currentSessionId]);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    syncUser();
    window.addEventListener('user-updated', syncUser);
    return () => window.removeEventListener('user-updated', syncUser);
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.sessions.list();
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const normalizeModelId = (modelId: unknown) => {
    if (typeof modelId !== 'string') return '';
    const trimmed = modelId.trim();
    return trimmed.includes('/') ? trimmed.split('/').pop() || trimmed : trimmed;
  };

  const normalizedSelectedModel = normalizeModelId(selectedModel);
  const filteredSessions = sessions.filter((s) => normalizeModelId(s?.model_id) === normalizedSelectedModel);
  const formatSessionDateTime = (session: any) => {
    const raw = session?.updated_at || session?.created_at;
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US');
  };
  const shortModelName = normalizeModelId(selectedModel) || selectedModel;

  return (
    <div className="w-64 bg-[var(--panel)] flex flex-col h-screen border-r border-[var(--border)]">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-[var(--border)] text-2xl font-semibold text-blue-400 truncate">
          {shortModelName}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id, session.model_id)}
              className={`w-full text-left p-3 flex items-center gap-3 hover:bg-[var(--panel-2)] transition ${
                currentSessionId === session.id ? 'bg-[var(--panel-2)]' : ''
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[var(--muted)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[var(--text)]">
                  {session.title || t('newChat')}
                </div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {formatSessionDateTime(session) || '—'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)] space-y-3">
        <div className="flex items-center gap-2 text-sm text-[var(--text)]">
          <User className="w-4 h-4 text-[var(--muted)]" />
          <span className="truncate">{user?.email || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text)]">
          <Wallet className="w-4 h-4 text-[var(--muted)]" />
          <span className="truncate">
            {typeof user?.usd_balance === 'number' ? `$${user.usd_balance.toFixed(4)}` : '—'}
          </span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-center gap-2 bg-[var(--panel-2)] hover:bg-[var(--panel-2)]/80 border border-[var(--border)] rounded py-2 text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </button>
      </div>
    </div>
  );
}
