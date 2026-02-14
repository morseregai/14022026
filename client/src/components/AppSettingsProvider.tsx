import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light'
type Locale = 'ru' | 'en'

type TranslationKey =
  | 'appTitle'
  | 'newChat'
  | 'signOut'
  | 'exit'
  | 'back'
  | 'forward'
  | 'profile'
  | 'loginLabel'
  | 'balanceLabel'
  | 'lastLoginLabel'
  | 'typeMessage'
  | 'selectChat'
  | 'startNewChat'
  | 'selectModel'
  | 'spendings'
  | 'spendingsTitle'
  | 'dateTime'
  | 'model'
  | 'amount'
  | 'noSpendings'
  | 'topUpBalance'
  | 'gift'
  | 'giftCodePrompt'
  | 'giftCodeOk'
  | 'giftCodeInvalid'
  | 'giftCodeAlready'
  | 'giftCodeApplied'
  | 'gotIt'
  | 'insufficientFundsTitle'
  | 'insufficientFundsBody'
  | 'ok'
  | 'welcomeBack'
  | 'createAccount'
  | 'email'
  | 'password'
  | 'signIn'
  | 'signUp'
  | 'processing'
  | 'dontHaveAccount'
  | 'alreadyHaveAccount'

const translations: Record<Locale, Record<TranslationKey, string>> = {
  ru: {
    appTitle: 'UltiChat Winter',
    newChat: 'Новый чат',
    signOut: 'Выйти',
    exit: 'Выход',
    back: 'Назад',
    forward: 'Вперед',
    profile: 'Профиль',
    loginLabel: 'Логин',
    balanceLabel: 'Баланс',
    lastLoginLabel: 'Последний вход',
    typeMessage: 'Введите сообщение...',
    selectChat: 'Выберите чат или создайте новый',
    startNewChat: 'Начать новый чат',
    selectModel: 'Выбор модели',
    spendings: 'Траты',
    spendingsTitle: 'Последние траты',
    dateTime: 'Дата/время',
    model: 'Модель',
    amount: 'Сумма',
    noSpendings: 'Списаний пока нет',
    topUpBalance: 'Пополните Баланс',
    gift: 'подарок',
    giftCodePrompt: 'Введите код:',
    giftCodeOk: 'ОК',
    giftCodeInvalid: 'Неверный код',
    giftCodeAlready: 'Код уже использован',
    giftCodeApplied: 'Баланс пополнен на $0.01',
    gotIt: 'Понятно!',
    insufficientFundsTitle: 'Недостаточно средств',
    insufficientFundsBody: 'Пополните баланс или выберите бесплатную модель (например, Xiaomi MiMo V2 Flash).',
    ok: 'Понятно',
    welcomeBack: 'С возвращением',
    createAccount: 'Создать аккаунт',
    email: 'Email',
    password: 'Пароль',
    signIn: 'Войти',
    signUp: 'Зарегистрироваться',
    processing: 'Обработка...',
    dontHaveAccount: 'Нет аккаунта?',
    alreadyHaveAccount: 'Уже есть аккаунт?',
  },
  en: {
    appTitle: 'UltiChat Winter',
    newChat: 'New chat',
    signOut: 'Sign out',
    exit: 'Exit',
    back: 'Back',
    forward: 'Continue',
    profile: 'Profile',
    loginLabel: 'Login',
    balanceLabel: 'Balance',
    lastLoginLabel: 'Last login',
    typeMessage: 'Type a message...',
    selectChat: 'Select a chat or start a new one',
    startNewChat: 'Start new chat',
    selectModel: 'Select model',
    spendings: 'Spending',
    spendingsTitle: 'Recent spending',
    dateTime: 'Date/time',
    model: 'Model',
    amount: 'Amount',
    noSpendings: 'No spending yet',
    topUpBalance: 'Top up balance',
    gift: 'Gift',
    giftCodePrompt: 'Enter code:',
    giftCodeOk: 'OK',
    giftCodeInvalid: 'Invalid code',
    giftCodeAlready: 'Code already used',
    giftCodeApplied: 'Balance topped up by $0.01',
    gotIt: 'Got it!',
    insufficientFundsTitle: 'Insufficient funds',
    insufficientFundsBody: 'Top up your balance or choose a free model (for example, Xiaomi MiMo V2 Flash).',
    ok: 'OK',
    welcomeBack: 'Welcome back',
    createAccount: 'Create account',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signUp: 'Sign up',
    processing: 'Processing...',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
  },
}

type AppSettings = {
  theme: Theme
  setTheme: (t: Theme) => void
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
}

const AppSettingsContext = createContext<AppSettings | null>(null)

function readStoredTheme(): Theme {
  const raw = localStorage.getItem('theme')
  return raw === 'light' || raw === 'dark' ? raw : 'dark'
}

function readStoredLocale(): Locale {
  const raw = localStorage.getItem('locale')
  return raw === 'ru' || raw === 'en' ? raw : 'ru'
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale())

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
  }

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<AppSettings>(() => {
    return {
      theme,
      setTheme,
      locale,
      setLocale,
      t: (key) => translations[locale][key],
    }
  }, [locale, theme])

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('AppSettingsProvider is missing')
  return ctx
}
