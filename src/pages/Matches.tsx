import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type MatchWithProfile = Tables<'matches'> & { otherProfile: Profile }

export function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)

      const { data: rawMatches } = await supabase
        .from('matches')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (!rawMatches || rawMatches.length === 0) {
        setMatches([])
        setLoading(false)
        return
      }

      const otherIds = rawMatches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a))
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds)
      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

      const combined = rawMatches
        .map((m) => {
          const otherId = m.user_a === user.id ? m.user_b : m.user_a
          const otherProfile = profileById.get(otherId)
          return otherProfile ? { ...m, otherProfile } : null
        })
        .filter((m): m is MatchWithProfile => m !== null)

      setMatches(combined)
      setLoading(false)
    }

    load()
  }, [user])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Your matches</h1>

      {loading ? (
        <p className="mt-6 text-ink/50">Loading matches…</p>
      ) : matches.length === 0 ? (
        <p className="mt-6 text-ink/50">
          No matches yet &mdash; head to Discover and put some rizz out there.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                to={`/chat/${m.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-rizz-lime/20"
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-rizz-purple text-lg font-bold text-white">
                  {m.otherProfile.photo_urls[0] ? (
                    <img
                      src={m.otherProfile.photo_urls[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    m.otherProfile.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-1 font-semibold">
                    {m.otherProfile.full_name}
                    {m.otherProfile.company_verified && (
                      <span className="text-rizz-purple" title="Verified company email">
                        ✓
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink/50">
                    {m.otherProfile.job_title} {m.otherProfile.company && `@ ${m.otherProfile.company}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
