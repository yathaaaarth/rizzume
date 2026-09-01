import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MatchModal } from '../components/MatchModal'
import { PalAvatar } from '../components/PalAvatar'
import { useAuth } from '../context/AuthContext'
import { useProfile, type Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

export function FanMail() {
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
      <h1 className="font-display text-2xl font-bold">Fan mail 💌</h1>
      <p className="mt-1 text-sm text-ink/60">These pals already waved at you.</p>

      {loading ? (
        <p className="mt-6 text-ink/50">Checking the mailbox…</p>
      ) : likers.length === 0 ? (
        <p className="mt-6 text-ink/50">
          Nothing yet. Head to the{' '}
          <Link to="/playground" className="font-bold text-grape">
            Playground
          </Link>{' '}
          and put yourself out there.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {likers.map((liker) => (
            <div key={liker.id} className="sticker-card flex flex-col items-center gap-2 bg-white p-4 text-center">
              <PalAvatar species={liker.pal_species} primary={liker.pal_color} accent={liker.pal_accent} size={64} />
              <p className="text-sm font-display font-bold">{liker.pal_name || liker.full_name}</p>
              <p className="truncate text-xs text-ink/50">
                {liker.job_title} {liker.company && `@ ${liker.company}`}
              </p>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => respond(liker, 'pass')}
                  disabled={busy}
                  className="sticker-btn flex-1 bg-white py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  👋
                </button>
                <button
                  onClick={() => respond(liker, 'like')}
                  disabled={busy}
                  className="sticker-btn flex-1 bg-bubblegum py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  🐾
                </button>
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
