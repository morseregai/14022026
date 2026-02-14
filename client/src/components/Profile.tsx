import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snowflake, User, Wallet, Clock, ArrowRight, LogOut, Settings } from 'lucide-react'
import { api } from '../lib/api'
import { useAppSettings } from './AppSettingsProvider'
import ModelsModal from './ModelsModal'

type ProfileData = {
  id: string
  email: string
  usd_balance: number | string | null
  last_login: string | null
  created_at?: string
}

export default function Profile() {
  const navigate = useNavigate()
  const { t, locale } = useAppSettings()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('selectedModel') || 'xiaomi/mimo-v2-flash'
  })

  const formattedBalance = useMemo(() => {
    const raw = profile?.usd_balance
    const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : null
    if (n === null || Number.isNaN(n)) return '—'
    return `$${n.toFixed(4)}`
  }, [profile?.usd_balance])

  const formattedLastLogin = useMemo(() => {
    if (!profile?.last_login) return '—'
    const d = new Date(profile.last_login)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US')
  }, [locale, profile?.last_login])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/auth')
      return
    }

    const load = async () => {
      try {
        const res = await api.auth.me()
        const p: ProfileData = res.profile
        setProfile(p)
        localStorage.setItem('user', JSON.stringify(p))
        window.dispatchEvent(new Event('user-updated'))
      } catch {
        const raw = localStorage.getItem('user')
        if (raw) setProfile(JSON.parse(raw))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const handleForward = () => {
    navigate('/dashboard')
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md p-8 bg-[var(--panel)] rounded-lg shadow-xl border border-[var(--border)]">
        <div className="flex justify-center mb-3">
          <Snowflake className="w-8 h-8 text-blue-300" />
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">{t('profile')}</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-3">
            <User className="w-5 h-5 text-[var(--muted)]" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--muted)]">{t('loginLabel')}</div>
              <div className="truncate text-sm">{loading ? '—' : (profile?.email || '—')}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-3">
            <Wallet className="w-5 h-5 text-[var(--muted)]" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--muted)]">{t('balanceLabel')}</div>
              <div className="truncate text-sm">{loading ? '—' : formattedBalance}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-3">
            <Clock className="w-5 h-5 text-[var(--muted)]" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--muted)]">{t('lastLoginLabel')}</div>
              <div className="truncate text-sm">{loading ? '—' : formattedLastLogin}</div>
            </div>
          </div>

          <div className="mt-2 bg-[var(--panel-2)] border border-blue-500/40 rounded-lg p-4">
            <button
              onClick={() => setIsModelsModalOpen(true)}
              className="w-full flex items-center gap-3 text-left"
              type="button"
            >
              <Settings className="w-5 h-5 text-blue-300" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-300/80">{t('selectModel')}</div>
                <div className="truncate text-2xl font-semibold text-blue-300">{selectedModel}</div>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleForward}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition flex items-center justify-center gap-2"
          >
            {t('forward')}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 bg-[var(--panel-2)] hover:bg-[var(--panel-2)]/80 border border-[var(--border)] rounded px-4 transition text-[var(--text)]"
          >
            <LogOut className="w-4 h-4" />
            {t('signOut')}
          </button>
        </div>
      </div>

      <ModelsModal
        isOpen={isModelsModalOpen}
        onClose={() => setIsModelsModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={(modelId) => {
          setSelectedModel(modelId)
          localStorage.setItem('selectedModel', modelId)
          window.dispatchEvent(new Event('model-updated'))
        }}
      />
    </div>
  )
}
