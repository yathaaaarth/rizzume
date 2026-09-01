import { useState } from 'react'
import { PalAvatar } from './PalAvatar'
import type { Profile } from '../hooks/useProfile'
import { calculateAge } from '../lib/rizzScore'

type PromptAnswer = { question: string; answer: string }

export function ResumeCard({
  profile,
  shortlisted,
  onToggleShortlist,
  onPass,
  onViewRizzCard,
}: {
  profile: Profile
  shortlisted: boolean
  onToggleShortlist: () => void
  onPass: () => void
  onViewRizzCard: () => void
}) {
  const [peeking, setPeeking] = useState(false)
  const age = calculateAge(profile.birthdate)
  const hasPhoto = profile.photo_urls.length > 0
  const prompts = (Array.isArray(profile.prompts) ? profile.prompts : []) as unknown as PromptAnswer[]

  return (
    <div
      className={`sticker-card flex flex-col gap-3 bg-white p-4 transition ${
        shortlisted ? 'ring-4 ring-sunshine' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => hasPhoto && setPeeking((v) => !v)}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-3 border-ink"
          title={hasPhoto ? (peeking ? 'Back to pal' : 'Peek at photo') : undefined}
        >
          {peeking && hasPhoto ? (
            <img src={profile.photo_urls[0]} alt={profile.full_name} className="h-full w-full object-cover" />
          ) : (
            <PalAvatar species={profile.pal_species} primary={profile.pal_color} accent={profile.pal_accent} size={56} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-lg font-bold leading-tight">
            {profile.full_name}
            {age ? <span className="font-normal text-ink/60">, {age}</span> : null}
            {profile.company_verified && <span className="ml-1 text-grape">✓</span>}
          </h2>
          <p className="truncate text-sm font-bold text-ink/70">
            {profile.job_title} {profile.company && `@ ${profile.company}`}
          </p>
          {profile.location && <p className="truncate text-xs text-ink/40">{profile.location}</p>}
        </div>

        <span className="sticker-btn shrink-0 bg-sunshine px-2 py-1 text-xs font-bold">🔥 {profile.rizz_points}</span>
      </div>

      {(profile.industry || profile.seniority) && (
        <div className="flex flex-wrap gap-1.5">
          {profile.industry && (
            <span className="rounded-full border-2 border-ink/15 px-2.5 py-0.5 text-xs font-bold text-ink/60">
              {profile.industry}
            </span>
          )}
          {profile.seniority && (
            <span className="rounded-full border-2 border-ink/15 px-2.5 py-0.5 text-xs font-bold text-ink/60">
              {profile.seniority}
            </span>
          )}
        </div>
      )}

      {prompts[0] && (
        <div className="rounded-2xl border-2 border-ink/10 bg-cream p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink/40">{prompts[0].question}</p>
          <p className="mt-0.5 line-clamp-2 text-sm">{prompts[0].answer}</p>
        </div>
      )}

      <button onClick={onViewRizzCard} className="self-start text-xs font-bold text-grape underline">
        View full Rizz Card →
      </button>

      <div className="mt-1 flex gap-2">
        <button onClick={onPass} className="sticker-btn flex-1 bg-white py-2 text-sm font-bold">
          Pass
        </button>
        <button
          onClick={onToggleShortlist}
          className={`sticker-btn flex-1 py-2 text-sm font-bold ${
            shortlisted ? 'bg-ink text-cream' : 'bg-bubblegum text-white'
          }`}
        >
          {shortlisted ? '✓ Shortlisted' : '📋 Shortlist'}
        </button>
      </div>
    </div>
  )
}
