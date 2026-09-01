import { Link } from 'react-router-dom'
import type { Profile } from '../hooks/useProfile'
import { PalAvatar } from './PalAvatar'
import { matchReasons } from '../lib/rizzScore'

export function MatchModal({ me, profile, onClose }: { me: Profile; profile: Profile; onClose: () => void }) {
  const reasons = matchReasons(me, profile)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
      <div className="sticker-card animate-pop-in flex max-w-sm flex-col items-center bg-white p-8 text-center">
        <span className="sticker-btn bg-sunshine px-4 py-1 text-xs font-bold uppercase tracking-widest">
          New pal unlocked!
        </span>

        <div className="mt-4 flex items-center gap-2">
          <PalAvatar species={me.pal_species} primary={me.pal_color} accent={me.pal_accent} size={72} />
          <span className="font-display text-3xl">🐾</span>
          <PalAvatar species={profile.pal_species} primary={profile.pal_color} accent={profile.pal_accent} size={72} />
        </div>

        <h2 className="font-display mt-4 text-3xl font-bold text-grape">
          {me.pal_name || 'Your pal'} + {profile.pal_name || profile.full_name}
        </h2>
        <p className="mt-2 text-ink/70">
          You waved, they waved back. Head to your Den and start decorating together.
        </p>

        {reasons.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {reasons.map((r) => (
              <span
                key={r}
                className="rounded-full border-2 border-ink/15 px-3 py-1 text-xs font-bold text-ink/70"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex w-full gap-3">
          <button onClick={onClose} className="sticker-btn flex-1 bg-white px-4 py-2.5 font-bold">
            Keep playing
          </button>
          <Link
            to="/pals"
            className="sticker-btn flex-1 bg-grape px-4 py-2.5 text-center font-bold text-white"
          >
            Visit the Den
          </Link>
        </div>
      </div>
    </div>
  )
}
