import { X, Wallet } from 'lucide-react'
import { useAppSettings } from './AppSettingsProvider'

interface BalanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BalanceModal({ isOpen, onClose }: BalanceModalProps) {
  if (!isOpen) return null
  const { t } = useAppSettings()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--panel)] rounded-lg shadow-xl w-full max-w-md p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-[var(--text)]">{t('insufficientFundsTitle')}</h3>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[var(--muted)]">{t('insufficientFundsBody')}</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
          >
            {t('ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
