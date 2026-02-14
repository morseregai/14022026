import { useState } from 'react';
import type { FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAppSettings } from './AppSettingsProvider';

interface InputAreaProps {
  onSend: (text: string) => void;
  loading: boolean;
}

export default function InputArea({ onSend, loading }: InputAreaProps) {
  const [input, setInput] = useState('');
  const { t } = useAppSettings();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)] bg-[var(--panel)]">
      <div className="relative flex items-center max-w-4xl mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('typeMessage')}
          className="w-full bg-[var(--panel-2)] border border-[var(--border)] rounded-full py-3 px-6 pr-12 focus:ring-2 focus:ring-blue-500 text-[var(--text)] placeholder-[var(--muted)] shadow-lg"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}
