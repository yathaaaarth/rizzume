import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PalAvatar } from '../components/PalAvatar'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type MatchWithProfile = Tables<'matches'> & { otherProfile: Profile }

export function Pals() {
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
      <h1 className="font-display text-2xl font-bold">My Pals 🐾</h1>

      {loading ? (
        <p className="mt-6 text-ink/50">Rounding them up…</p>
      ) : matches.length === 0 ? (
        <p className="mt-6 text-ink/50">
          No pals yet &mdash; head to the{' '}
          <Link to="/playground" className="font-bold text-grape">
            Playground
          </Link>{' '}
          and start waving.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {matches.map((m) => (
            <Link
              key={m.id}
              to={`/den/${m.id}`}
              className="sticker-card wiggle-on-hover flex flex-col items-center gap-2 bg-white p-4 text-center transition"
            >
              <PalAvatar
                species={m.otherProfile.pal_species}
                primary={m.otherProfile.pal_color}
                accent={m.otherProfile.pal_accent}
                size={72}
              />
              <p className="flex items-center gap-1 font-display font-bold">
                {m.otherProfile.pal_name || m.otherProfile.full_name}
                {m.otherProfile.company_verified && (
                  <span className="text-grape" title="Verified company email">
                    ✓
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-ink/50">
                {m.otherProfile.job_title} {m.otherProfile.company && `@ ${m.otherProfile.company}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
