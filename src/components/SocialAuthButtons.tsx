import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PROVIDERS = [
  { key: 'google', label: 'Google', emoji: '🔵' },
  { key: 'github', label: 'GitHub', emoji: '⚫' },
  { key: 'linkedin_oidc', label: 'LinkedIn', emoji: '🔷' },
] as const

export function SocialAuthButtons() {
  const [error, setError] = useState<string | null>(null)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleClick = async (provider: (typeof PROVIDERS)[number]['key']) => {
    setError(null)
    setLoadingProvider(provider)

    // On success the browser navigates away to the provider, unmounting this
    // component — so if we're still here after a few seconds, the redirect
    // never happened (most likely: this provider isn't enabled in Supabase
    // yet). Fail loudly instead of leaving the button stuck forever.
    const stuckTimer = setTimeout(() => {
      setLoadingProvider(null)
      setError(`${provider} sign-in didn't start — it likely isn't enabled in Supabase yet.`)
    }, 5000)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/playground` },
    })

    if (oauthError) {
      clearTimeout(stuckTimer)
      setError(oauthError.message)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-bold text-ink/40">
        <div className="h-px flex-1 bg-ink/10" />
        or continue with
        <div className="h-px flex-1 bg-ink/10" />
      </div>
      <div className="flex gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => handleClick(p.key)}
            disabled={loadingProvider !== null}
            className="sticker-btn flex-1 bg-white py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {loadingProvider === p.key ? '…' : `${p.emoji} ${p.label}`}
          </button>
        ))}
      </div>
      {error && <p className="text-xs font-bold text-coral">{error}</p>}
      <p className="text-center text-[11px] text-ink/40">
        Needs the provider enabled in Supabase Auth settings.
      </p>
    </div>
  )
}
