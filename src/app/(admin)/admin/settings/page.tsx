'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle2, Building2, Type, FileText, Globe } from 'lucide-react'

interface BrandingForm {
  app_name: string
  app_subtitle: string
  app_tagline: string
  company_name: string
  company_year: string
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<BrandingForm>({
    app_name: '',
    app_subtitle: '',
    app_tagline: '',
    company_name: '',
    company_year: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setForm({
          app_name: data.app_name || 'Bourcha',
          app_subtitle: data.app_subtitle || 'Room Booking',
          app_tagline: data.app_tagline || '',
          company_name: data.company_name || 'BOURCHANIN & CIE',
          company_year: data.company_year || new Date().getFullYear().toString(),
        })
        setIsLoading(false)
      })
  }, [])

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
    { key: 'app_name',     label: 'Nom de l\'application', icon: Type,      placeholder: 'Bourcha',           hint: 'Titre principal affiché sur la page de connexion' },
    { key: 'app_subtitle', label: 'Sous-titre',             icon: Type,      placeholder: 'Room Booking',      hint: 'Sous-titre sous le nom principal' },
    { key: 'app_tagline',  label: 'Slogan / Description',   icon: FileText,  placeholder: 'Réservez vos...',   hint: 'Texte descriptif affiché sous le sous-titre' },
    { key: 'company_name', label: 'Nom de la société',      icon: Building2, placeholder: 'BOURCHANIN & CIE',  hint: 'Apparaît dans le footer de la page de connexion' },
    { key: 'company_year', label: 'Année copyright',        icon: Globe,     placeholder: '2024',              hint: 'Année affichée dans © Année' },
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
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
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

      {/* Formulaire */}
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
