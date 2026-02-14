import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from './AppSettingsProvider';

export default function Dashboard() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const canonicalizeModelId = (modelId: string) => {
    const trimmed = modelId.trim();
    if (trimmed.includes('/')) return trimmed;
    const map: Record<string, string> = {
      'mimo-v2-flash': 'xiaomi/mimo-v2-flash',
      'gpt-4o-mini': 'openai/gpt-4o-mini',
      'gemini-3-flash-preview': 'google/gemini-3-flash-preview',
    };
    return map[trimmed] || trimmed;
  };

  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem('selectedModel');
    return stored ? canonicalizeModelId(stored) : 'xiaomi/mimo-v2-flash';
  });
  const { t } = useAppSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    const syncModel = () => {
      const stored = localStorage.getItem('selectedModel');
      if (stored) {
        const canon = canonicalizeModelId(stored);
        if (canon !== selectedModel) setSelectedModel(canon);
      }
    };
    window.addEventListener('model-updated', syncModel);
    return () => window.removeEventListener('model-updated', syncModel);
  }, [selectedModel]);

  const handleNewChat = async () => {
    try {
      const session = await api.sessions.create(selectedModel);
      setCurrentSessionId(session.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      <Sidebar
        currentSessionId={currentSessionId}
        onSelectSession={(id, modelId) => {
          setCurrentSessionId(id)
          if (modelId) {
            const canon = canonicalizeModelId(modelId)
            if (canon !== selectedModel) setSelectedModel(canon)
            localStorage.setItem('selectedModel', canon)
            window.dispatchEvent(new Event('model-updated'))
          }
        }}
        selectedModel={selectedModel}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {currentSessionId ? (
          <ChatArea sessionId={currentSessionId} modelId={selectedModel} />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-[var(--muted)]">
            <h1 className="text-4xl font-bold mb-4 text-[color:var(--border)]">{t('appTitle')}</h1>
            <p>{t('selectChat')}</p>
            <button
              onClick={handleNewChat}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('startNewChat')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
