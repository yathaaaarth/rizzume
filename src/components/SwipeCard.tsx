import { useState } from 'react'
import { PalAvatar } from './PalAvatar'
import type { Profile } from '../hooks/useProfile'
import { calculateAge } from '../lib/rizzScore'

type PromptAnswer = { question: string; answer: string }

export function SwipeCard({ profile }: { profile: Profile }) {
  const [peeking, setPeeking] = useState(false)
  const age = calculateAge(profile.birthdate)
  const hasPhoto = profile.photo_urls.length > 0
  const prompts = (Array.isArray(profile.prompts) ? profile.prompts : []) as unknown as PromptAnswer[]

  return (
    <div className="sticker-card flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="relative flex h-2/5 shrink-0 items-center justify-center bg-gradient-to-br from-sunshine/60 to-bubblegum/40">
        {peeking && hasPhoto ? (
          <img src={profile.photo_urls[0]} alt={profile.full_name} className="h-full w-full object-cover" />
        ) : (
          <PalAvatar
            species={profile.pal_species}
            primary={profile.pal_color}
            accent={profile.pal_accent}
            size={140}
            className="animate-pop-in"
          />
        )}

        {hasPhoto && (
          <button
            type="button"
            onClick={() => setPeeking((v) => !v)}
            className="sticker-btn absolute bottom-2 right-2 bg-white px-3 py-1 text-xs font-bold"
          >
            {peeking ? '🐾 Back to pal' : '👀 Peek'}
          </button>
        )}

        {profile.job_title && profile.company && (
          <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full border-3 border-ink bg-sunshine px-3 py-1 text-xs font-bold text-ink">
            {profile.company_verified && profile.company_domain && (
              <img
                src={`https://logo.clearbit.com/${profile.company_domain}`}
                alt=""
                className="h-4 w-4 rounded-full bg-white object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            {profile.job_title} @ {profile.company}
            {profile.company_verified && <span title="Verified company email">✓</span>}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-5">
        <h2 className="font-display text-2xl font-bold">
          {profile.pal_name || profile.full_name}
          {age ? <span className="font-normal text-ink/60">, {age}</span> : null}
        </h2>
        <p className="-mt-1 text-xs font-bold uppercase tracking-wide text-grape">{profile.full_name}</p>
        {profile.location && <p className="text-sm text-ink/50">{profile.location}</p>}
        {profile.bio && <p className="text-sm text-ink/70">{profile.bio}</p>}
        {profile.industry && (
          <span className="w-fit rounded-full border-2 border-ink/20 px-3 py-1 text-xs font-bold text-ink/60">
            {profile.industry} · {profile.seniority}
          </span>
        )}
        {prompts.map((p, idx) => (
          <div key={idx} className="rounded-2xl border-2 border-ink/10 bg-cream p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">{p.question}</p>
            <p className="mt-1 text-sm">{p.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
