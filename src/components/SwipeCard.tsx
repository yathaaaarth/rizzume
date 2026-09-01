import type { Profile } from '../hooks/useProfile'

function calculateAge(birthdate: string | null) {
  if (!birthdate) return null
  const dob = new Date(birthdate)
  const diff = Date.now() - dob.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export function SwipeCard({ profile }: { profile: Profile }) {
  const age = calculateAge(profile.birthdate)
  const photo = profile.photo_urls[0]

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-xl">
      <div className="relative h-2/3 w-full bg-gradient-to-br from-rizz-purple to-rizz-purple-dark">
        {photo ? (
          <img src={photo} alt={profile.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-white/90">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        {profile.job_title && profile.company && (
          <span className="absolute bottom-3 left-3 rounded-full bg-rizz-lime px-3 py-1 text-xs font-bold text-ink">
            {profile.job_title} @ {profile.company}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="font-display text-2xl font-bold">
          {profile.full_name}
          {age ? <span className="font-normal text-ink/60">, {age}</span> : null}
        </h2>
        {profile.location && <p className="text-sm text-ink/50">{profile.location}</p>}
        {profile.bio && <p className="text-sm text-ink/70">{profile.bio}</p>}
        {profile.industry && (
          <span className="mt-auto w-fit rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/60">
            {profile.industry} · {profile.seniority}
          </span>
        )}
      </div>
    </div>
  )
}
