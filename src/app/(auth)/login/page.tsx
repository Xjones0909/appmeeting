'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

interface Branding {
  app_name: string
  app_subtitle: string
  app_tagline: string
  company_name: string
  company_year: string
  app_logo: string
}

const DEFAULT_BRANDING: Branding = {
  app_name: 'Bourcha',
  app_subtitle: 'Room Booking',
  app_tagline: 'Réservez vos salles de réunion en quelques secondes. Simple, rapide et efficace.',
  company_name: 'BOURCHANIN & CIE',
  company_year: new Date().getFullYear().toString(),
  app_logo: '',
}

function AppLogo({ logo, size = 'lg' }: { logo: string; size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg'
  if (logo) {
    return (
      <img
        src={logo}
        alt="Logo"
        className={isLg ? 'w-12 h-12 object-contain' : 'w-6 h-6 object-contain'}
      />
    )
  }
  return <Building2 className={isLg ? 'w-10 h-10 text-white' : 'w-5 h-5 text-white'} />
}

export default function LoginPage() {
  const router = useRouter()
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.app_name) setBranding({ ...DEFAULT_BRANDING, ...data })
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('Email ou mot de passe incorrect.')
        setIsLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Réessayez.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-3xl mb-8 ring-2 ring-white/20 overflow-hidden">
            <AppLogo logo={branding.app_logo} size="lg" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">{branding.app_name}</h1>
          <p className="text-xl text-primary-200 font-medium mb-4">{branding.app_subtitle}</p>
          <p className="text-primary-300 text-sm max-w-xs leading-relaxed">{branding.app_tagline}</p>
        </div>

        <div className="absolute bottom-8 text-center">
          <p className="text-primary-400 text-xs">{branding.company_name} © {branding.company_year}</p>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center overflow-hidden">
              <AppLogo logo={branding.app_logo} size="sm" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{branding.app_name} {branding.app_subtitle}</div>
              <div className="text-xs text-slate-500">{branding.company_name}</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Bon retour ! 👋</h2>
            <p className="text-slate-500 mt-1.5 text-sm">
              Connectez-vous pour accéder à votre espace de réservation
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="vous@bourcha.com" className="input pl-10"
                  required autoComplete="email" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input pl-10 pr-11"
                  required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember"
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="remember" className="text-sm text-slate-600">Rester connecté</label>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Connexion en cours...</>
              ) : (
                <>Se connecter <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-10">
            © {branding.company_year} {branding.app_name} {branding.app_subtitle} · {branding.company_name}
          </p>
        </div>
      </div>
    </div>
  )
}
