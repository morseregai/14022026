import { X, Check } from 'lucide-react';
import { useAppSettings } from './AppSettingsProvider';

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', cost: 'Low' },
  { id: 'xiaomi/mimo-v2-flash', name: 'Xiaomi MiMo V2 Flash', cost: 'Free' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: 'Low' },
];

export default function ModelsModal({ isOpen, onClose, selectedModel, onSelectModel }: ModelsModalProps) {
  if (!isOpen) return null;
  const { t } = useAppSettings();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--panel)] rounded-lg shadow-xl w-full max-w-md p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[var(--text)]">{t('selectModel')}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelectModel(model.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition ${
                selectedModel === model.id
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-[var(--panel-2)]/70 border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-[var(--muted)]">{model.cost}</span>
              </div>
              {selectedModel === model.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
