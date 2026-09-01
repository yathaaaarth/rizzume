import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MatchModal } from '../components/MatchModal'
import { useAuth } from '../context/AuthContext'
import { useProfile, type Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

export function Likes() {
  const { user } = useAuth()
  const { profile: myProfile } = useProfile()
  const [likers, setLikers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [matchedWith, setMatchedWith] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: mySwipes } = await supabase.from('swipes').select('swiped_id').eq('swiper_id', user.id)
    const alreadyResponded = new Set((mySwipes ?? []).map((s) => s.swiped_id))

    const { data: incoming } = await supabase
      .from('swipes')
      .select('swiper_id')
      .eq('swiped_id', user.id)
      .eq('direction', 'like')

    const pendingIds = (incoming ?? [])
      .map((s) => s.swiper_id)
      .filter((id) => !alreadyResponded.has(id))

    if (pendingIds.length === 0) {
      setLikers([])
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', pendingIds)
    setLikers(profiles ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const respond = async (liker: Profile, direction: 'like' | 'pass') => {
    if (!user || busy) return
    setBusy(true)

    await supabase.from('swipes').insert({ swiper_id: user.id, swiped_id: liker.id, direction })

    if (direction === 'like') {
      setMatchedWith(liker)
    }

    setLikers((prev) => prev.filter((p) => p.id !== liker.id))
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Who liked you</h1>

      {loading ? (
        <p className="mt-6 text-ink/50">Loading…</p>
      ) : likers.length === 0 ? (
        <p className="mt-6 text-ink/50">
          No pending likes yet. Head to{' '}
          <Link to="/discover" className="font-semibold text-rizz-purple">
            Discover
          </Link>{' '}
          and put some rizz out there.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {likers.map((liker) => (
            <div key={liker.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-rizz-purple to-rizz-purple-dark text-3xl font-bold text-white">
                {liker.photo_urls[0] ? (
                  <img src={liker.photo_urls[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  liker.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold">{liker.full_name}</p>
                <p className="truncate text-xs text-ink/50">
                  {liker.job_title} {liker.company && `@ ${liker.company}`}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => respond(liker, 'pass')}
                    disabled={busy}
                    className="flex-1 rounded-full border border-ink/15 py-1.5 text-xs font-semibold text-ink/60 disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => respond(liker, 'like')}
                    disabled={busy}
                    className="flex-1 rounded-full bg-rizz-purple py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Like
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {matchedWith && myProfile && (
        <MatchModal me={myProfile} profile={matchedWith} onClose={() => setMatchedWith(null)} />
      )}
    </div>
  )
}
