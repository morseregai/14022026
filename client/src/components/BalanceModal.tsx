import { useState } from 'react'
import { X, Wallet } from 'lucide-react'
import { api } from '../lib/api'
import { useAppSettings } from './AppSettingsProvider'

interface BalanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BalanceModal({ isOpen, onClose }: BalanceModalProps) {
  if (!isOpen) return null
  const { t } = useAppSettings()
  const [redeeming, setRedeeming] = useState(false)

  const applyBalance = (newBalance: number) => {
    const raw = localStorage.getItem('user')
    if (!raw) return
    try {
      const u = JSON.parse(raw)
      u.usd_balance = newBalance
      localStorage.setItem('user', JSON.stringify(u))
      window.dispatchEvent(new Event('user-updated'))
    } catch {
      return
    }
  }

  const handleGift = async () => {
    if (redeeming) return
    const code = window.prompt(t('giftCodePrompt'))
    if (code === null) return
    setRedeeming(true)
    try {
      const res = await api.transactions.redeemGift(String(code).trim())
      if (res && typeof res.balance !== 'undefined') {
        const b = typeof res.balance === 'string' ? Number(res.balance) : res.balance
        if (Number.isFinite(b)) applyBalance(b)
      }
      window.alert(t('giftCodeApplied'))
      onClose()
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('already')) {
        window.alert(t('giftCodeAlready'))
      } else {
        window.alert(t('giftCodeInvalid'))
      }
    } finally {
      setRedeeming(false)
    }
  }

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
        <div className="text-2xl font-bold text-red-500">{t('topUpBalance')}</div>
        <p className="mt-2 text-[var(--muted)]">{t('insufficientFundsBody')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleGift}
            className="bg-[var(--panel-2)] hover:bg-[var(--panel-2)]/80 border border-[var(--border)] rounded py-2 px-4 transition text-[var(--text)] font-semibold"
            type="button"
            disabled={redeeming}
          >
            {t('gift')}
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            type="button"
            disabled={redeeming}
          >
            {t('gotIt')}
          </button>
        </div>
      </div>
    </div>
  )
}
