import { Link } from 'react-router-dom'
import type { Profile } from '../hooks/useProfile'
import { matchReasons } from '../lib/rizzScore'

export function MatchModal({ me, profile, onClose }: { me: Profile; profile: Profile; onClose: () => void }) {
  const reasons = matchReasons(me, profile)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
      <div className="flex max-w-sm flex-col items-center rounded-3xl bg-paper p-8 text-center shadow-2xl">
        <span className="rounded-full bg-rizz-lime px-4 py-1 text-xs font-bold uppercase tracking-widest text-ink">
          It's a match
        </span>
        <h2 className="font-display mt-4 text-3xl font-bold text-rizz-purple">
          You and {profile.full_name}
        </h2>
        <p className="mt-2 text-ink/70">
          You both have rizz. Time to talk about something other than your job title.
        </p>

        {reasons.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {reasons.map((r) => (
              <span
                key={r}
                className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/70"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 font-semibold text-ink"
          >
            Keep swiping
          </button>
          <Link
            to="/matches"
            className="flex-1 rounded-full bg-ink px-4 py-2.5 text-center font-semibold text-paper"
          >
            Say hi
          </Link>
        </div>
      </div>
    </div>
  )
}
