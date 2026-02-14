import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { api } from '../lib/api'
import { useAppSettings } from './AppSettingsProvider'

type SpendItem = {
  created_at: string
  model: string
  amount: number | string
}

export default function SpendingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { t, locale } = useAppSettings()
  const [items, setItems] = useState<SpendItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    api.transactions
      .spend(10)
      .then((data: SpendItem[]) => {
        if (cancelled) return
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const rows = useMemo(() => {
    return items.map((it, idx) => {
      const d = new Date(it.created_at)
      const dt = Number.isNaN(d.getTime()) ? it.created_at : d.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')
      const rawAmount = typeof it.amount === 'string' ? Number(it.amount) : it.amount
      const amount = Number.isFinite(rawAmount) ? Math.abs(rawAmount).toFixed(4) : '0.0000'
      return { key: `${it.created_at}-${idx}`, dt, model: it.model || '—', amount }
    })
  }, [items, locale])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--panel)] rounded-lg shadow-xl w-full max-w-2xl p-6 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[var(--text)]">{t('spendingsTitle')}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-[var(--panel-2)]">
              <tr>
                <th className="text-left p-3 font-semibold">{t('dateTime')}</th>
                <th className="text-left p-3 font-semibold">{t('model')}</th>
                <th className="text-right p-3 font-semibold">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3 text-[var(--muted)]" colSpan={3}>
                    {t('processing')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-[var(--muted)]" colSpan={3}>
                    {t('noSpendings')}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.key} className="border-t border-[var(--border)]">
                    <td className="p-3 whitespace-nowrap">{r.dt}</td>
                    <td className="p-3">{r.model}</td>
                    <td className="p-3 text-right tabular-nums">{r.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition"
            type="button"
          >
            {t('ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

