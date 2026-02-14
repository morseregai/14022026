import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Loader2, Bot, User as UserIcon } from 'lucide-react';
import InputArea from './InputArea';
import BalanceModal from './BalanceModal';

interface ChatAreaProps {
  sessionId: string;
  modelId: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: any;
}

export default function ChatArea({ sessionId, modelId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const data = await api.sessions.getMessages(sessionId);
      const uiMessages = data.map((m: any) => ({
        role: m.role,
        content: typeof m.content === 'string' ? JSON.parse(m.content) : m.content
      }));
      setMessages(uiMessages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (text: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: [{ text }] }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: Array.isArray(m.content) ? m.content : [{ text: String(m.content) }]
      }));

      const res = await api.chat.send({
        modelId,
        sessionId,
        history,
        currentParts: [{ text }],
        apiKey: null 
      });

      setMessages([
        ...newMessages,
        { role: 'assistant', content: [{ text: res.reply }] }
      ]);

      if (typeof res.balance !== 'undefined') {
        const raw = localStorage.getItem('user')
        if (raw) {
          const u = JSON.parse(raw)
          u.usd_balance = typeof res.balance === 'string' ? Number(res.balance) : res.balance
          localStorage.setItem('user', JSON.stringify(u))
          window.dispatchEvent(new Event('user-updated'))
        }
      }
      
    } catch (err: any) {
      if (String(err?.message || '').toLowerCase().includes('insufficient balance')) {
        setIsBalanceModalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      return content.map((part: any, i: number) => <span key={i}>{part.text}</span>);
    }
    return String(content);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] text-[var(--text)] relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 max-w-4xl mx-auto ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-[var(--panel)] text-[var(--text)] rounded-tl-none border border-[var(--border)]'
              }`}
            >
              {renderContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-4 max-w-4xl mx-auto">
             <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot size={16} />
            </div>
            <div className="bg-[var(--panel)] p-4 rounded-2xl rounded-tl-none border border-[var(--border)]">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted)]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputArea onSend={handleSend} loading={loading} />
      <BalanceModal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} />
    </div>
  );
}
