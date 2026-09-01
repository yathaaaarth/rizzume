import { useState } from 'react'
import type { Profile } from '../hooks/useProfile'
import { calculateAge } from '../lib/rizzScore'

type PromptAnswer = { question: string; answer: string }

export function SwipeCard({ profile }: { profile: Profile }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const age = calculateAge(profile.birthdate)
  const photos = profile.photo_urls.length > 0 ? profile.photo_urls : [null]
  const photo = photos[Math.min(photoIndex, photos.length - 1)]
  const prompts = (Array.isArray(profile.prompts) ? profile.prompts : []) as unknown as PromptAnswer[]

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-xl">
      <div className="relative h-2/3 w-full shrink-0 bg-gradient-to-br from-rizz-purple to-rizz-purple-dark">
        {photo ? (
          <img src={photo} alt={profile.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-white/90">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}

        {photos.length > 1 && (
          <>
            <div className="absolute inset-x-0 top-0 flex gap-1 p-2">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
              className="absolute inset-y-0 left-0 w-1/3"
            />
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
              className="absolute inset-y-0 right-0 w-1/3"
            />
          </>
        )}

        {profile.job_title && profile.company && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-rizz-lime px-3 py-1 text-xs font-bold text-ink">
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
          {profile.full_name}
          {age ? <span className="font-normal text-ink/60">, {age}</span> : null}
        </h2>
        {profile.location && <p className="text-sm text-ink/50">{profile.location}</p>}
        {profile.bio && <p className="text-sm text-ink/70">{profile.bio}</p>}
        {profile.industry && (
          <span className="w-fit rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/60">
            {profile.industry} · {profile.seniority}
          </span>
        )}
        {prompts.map((p, idx) => (
          <div key={idx} className="rounded-xl bg-ink/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{p.question}</p>
            <p className="mt-1 text-sm">{p.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
