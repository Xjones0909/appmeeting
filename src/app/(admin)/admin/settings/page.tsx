'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Loader2, CheckCircle2, Building2, Type, FileText, Globe, ImagePlus, X } from 'lucide-react'

interface BrandingForm {
  app_name: string
  app_subtitle: string
  app_tagline: string
  company_name: string
  company_year: string
  app_logo: string
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<BrandingForm>({
    app_name: '',
    app_subtitle: '',
    app_tagline: '',
    company_name: '',
    company_year: '',
    app_logo: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [logoError, setLogoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          app_name:     data.app_name     || 'Bourcha',
          app_subtitle: data.app_subtitle || 'Room Booking',
          app_tagline:  data.app_tagline  || '',
          company_name: data.company_name || 'BOURCHANIN & CIE',
          company_year: data.company_year || new Date().getFullYear().toString(),
          app_logo:     data.app_logo     || '',
        })
        setIsLoading(false)
      })
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1.5 * 1024 * 1024) {
      setLogoError('Image trop grande — 1.5 Mo maximum (PNG, JPG, SVG)')
      e.target.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      setLogoError('Fichier invalide — choisissez une image (PNG, JPG, SVG)')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setForm(prev => ({ ...prev, app_logo: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const fields = [
    { key: 'app_name',     label: "Nom de l'application", icon: Type,      placeholder: 'Bourcha',           hint: 'Titre principal affiché sur la page de connexion' },
    { key: 'app_subtitle', label: 'Sous-titre',            icon: Type,      placeholder: 'Room Booking',      hint: 'Sous-titre sous le nom principal' },
    { key: 'app_tagline',  label: 'Slogan / Description',  icon: FileText,  placeholder: 'Réservez vos...',   hint: 'Texte descriptif affiché sous le sous-titre' },
    { key: 'company_name', label: 'Nom de la société',     icon: Building2, placeholder: 'BOURCHANIN & CIE',  hint: 'Apparaît dans le footer de la page de connexion' },
    { key: 'company_year', label: 'Année copyright',       icon: Globe,     placeholder: '2026',              hint: 'Année affichée dans © Année' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Paramètres de l&apos;application</h1>
        <p className="page-subtitle">Personnalisez le branding de la page de connexion</p>
      </div>

      {/* Aperçu live */}
      <div className="card mb-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <p className="text-primary-300 text-xs font-semibold uppercase tracking-wide mb-4">Aperçu · Page de connexion</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.app_logo ? (
              <img src={form.app_logo} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="text-xl font-bold">{form.app_name}</div>
            <div className="text-primary-200 text-sm">{form.app_subtitle}</div>
          </div>
        </div>
        {form.app_tagline && (
          <p className="text-primary-300 text-sm mt-3 leading-relaxed">{form.app_tagline}</p>
        )}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-primary-400 text-xs">{form.company_name} © {form.company_year}</p>
        </div>
      </div>

      {/* Logo upload */}
      <div className="card mb-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-slate-400" />
          Logo / Icône de l&apos;application
        </h3>
        <p className="text-xs text-slate-400 mb-4">PNG, JPG ou SVG · max 1.5 Mo · Recommandé : 128×128 px</p>

        <div className="flex items-center gap-4">
          {/* Current logo preview */}
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {form.app_logo ? (
              <img src={form.app_logo} alt="Logo actuel" className="w-14 h-14 object-contain" />
            ) : (
              <Building2 className="w-7 h-7 text-slate-300" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                {form.app_logo ? 'Changer le logo' : 'Choisir une image'}
              </button>

              {form.app_logo && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, app_logo: '' }))}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Supprimer
                </button>
              )}
            </div>
            {logoError && (
              <p className="text-xs text-red-500 mt-2">{logoError}</p>
            )}
            {form.app_logo && !logoError && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logo chargé — cliquez Sauvegarder pour appliquer
              </p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/ico"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      {/* Formulaire texte */}
      <div className="card">
        <div className="space-y-5">
          {fields.map(({ key, label, icon: Icon, placeholder, hint }) => (
            <div key={key}>
              <label className="label flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {label}
              </label>
              {key === 'app_tagline' ? (
                <textarea
                  className="input resize-none h-20"
                  placeholder={placeholder}
                  value={form[key as keyof BrandingForm]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
              ) : (
                <input
                  type="text"
                  className="input"
                  placeholder={placeholder}
                  value={form[key as keyof BrandingForm]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                />
              )}
              <p className="text-xs text-slate-400 mt-1">{hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Modifications sauvegardées !
            </div>
          )}
          <div className="ml-auto">
            <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
              ) : (
                <><Save className="w-4 h-4" />Sauvegarder</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
