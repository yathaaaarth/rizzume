import { PalAvatar } from './PalAvatar'
import type { Profile } from '../hooks/useProfile'
import { calculateAge } from '../lib/rizzScore'

type PromptAnswer = { question: string; answer: string }
type ScoreBreakdown = { label: string; note: string }

const SOCIAL_LINKS = [
  { key: 'instagram_handle', emoji: '📸', label: 'Instagram' },
  { key: 'linkedin_url', emoji: '💼', label: 'LinkedIn' },
  { key: 'letterboxd_url', emoji: '🎬', label: 'Letterboxd' },
  { key: 'goodreads_url', emoji: '📚', label: 'Goodreads' },
] as const

export function RizzCard({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const age = calculateAge(profile.birthdate)
  const prompts = (Array.isArray(profile.prompts) ? profile.prompts : []) as unknown as PromptAnswer[]
  const breakdown = (
    Array.isArray(profile.social_score_breakdown) ? profile.social_score_breakdown : []
  ) as unknown as ScoreBreakdown[]
  const links = SOCIAL_LINKS.filter((s) => profile[s.key])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-8">
      <div className="sticker-card animate-pop-in flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between border-b-3 border-ink/10 bg-sunshine/40 p-5">
          <span className="font-display text-lg font-bold uppercase tracking-wide">Rizz Card</span>
          <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <PalAvatar species={profile.pal_species} primary={profile.pal_color} accent={profile.pal_accent} size={64} />
            <div>
              <h2 className="font-display text-xl font-bold leading-tight">
                {profile.full_name}
                {age ? <span className="font-normal text-ink/60">, {age}</span> : null}
                {profile.company_verified && <span className="ml-1 text-grape">✓</span>}
              </h2>
              <p className="text-sm text-ink/60">
                {profile.job_title} {profile.company && `@ ${profile.company}`}
              </p>
              {profile.location && <p className="text-xs text-ink/40">{profile.location}</p>}
            </div>
            <span className="sticker-btn ml-auto shrink-0 bg-sunshine px-3 py-1 text-xs font-bold">
              🔥 {profile.rizz_points}
            </span>
          </div>

          {profile.bio && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Summary</p>
              <p className="mt-1 text-sm">{profile.bio}</p>
            </div>
          )}

          {(profile.industry || profile.seniority) && (
            <div className="flex flex-wrap gap-2">
              {profile.industry && (
                <span className="rounded-full border-2 border-ink/20 px-3 py-1 text-xs font-bold text-ink/60">
                  {profile.industry}
                </span>
              )}
              {profile.seniority && (
                <span className="rounded-full border-2 border-ink/20 px-3 py-1 text-xs font-bold text-ink/60">
                  {profile.seniority}
                </span>
              )}
            </div>
          )}

          {prompts.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Highlights</p>
              <ul className="mt-1 flex flex-col gap-2">
                {prompts.map((p, idx) => (
                  <li key={idx} className="rounded-2xl border-2 border-ink/10 bg-cream p-3">
                    <p className="text-xs font-bold text-ink/50">{p.question}</p>
                    <p className="mt-0.5 text-sm">{p.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {links.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Socials</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {links.map((s) => (
                  <span key={s.key} className="rounded-full border-2 border-ink/15 px-3 py-1 text-xs font-bold">
                    {s.emoji} {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {breakdown.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Rizz breakdown</p>
              <ul className="mt-1 flex flex-col gap-1">
                {breakdown.map((b, idx) => (
                  <li key={idx} className="text-xs text-ink/60">
                    <span className="font-bold">{b.label}:</span> {b.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
