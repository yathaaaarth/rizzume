import { useCallback, useEffect, useState } from 'react'
import { MatchModal } from '../components/MatchModal'
import { SwipeCard } from '../components/SwipeCard'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

export function Discover() {
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [matchedWith, setMatchedWith] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)

  const loadCandidates = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: mySwipes } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id)

    const swipedIds = mySwipes?.map((s) => s.swiped_id) ?? []

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_complete', true)
      .neq('id', user.id)
      .limit(25)

    if (swipedIds.length > 0) {
      query = query.not('id', 'in', `(${swipedIds.join(',')})`)
    }

    const { data } = await query
    setCandidates(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  const current = candidates[0]

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (!user || !current || busy) return
    setBusy(true)

    await supabase.from('swipes').insert({
      swiper_id: user.id,
      swiped_id: current.id,
      direction,
    })

    if (direction === 'like') {
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .or(
          `and(user_a.eq.${user.id},user_b.eq.${current.id}),and(user_a.eq.${current.id},user_b.eq.${user.id})`,
        )
        .maybeSingle()

      if (match) {
        setMatchedWith(current)
      }
    }

    setCandidates((prev) => prev.slice(1))
    setBusy(false)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Discover</h1>
      <p className="mt-1 text-sm text-ink/60">Verified professionals near you.</p>

      <div className="mt-6 h-[520px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-ink/50">
            Finding people worth your time…
          </div>
        ) : current ? (
          <SwipeCard profile={current} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-ink/20 text-center text-ink/50">
            <p className="font-semibold">You're all caught up</p>
            <p className="text-sm">Check back later for more profiles.</p>
          </div>
        )}
      </div>

      {current && (
        <div className="mt-6 flex gap-6">
          <button
            onClick={() => handleSwipe('pass')}
            disabled={busy}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink/15 text-2xl text-ink/60 shadow-sm transition hover:border-rizz-coral hover:text-rizz-coral disabled:opacity-50"
            aria-label="Pass"
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe('like')}
            disabled={busy}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-rizz-purple text-2xl text-white shadow-lg transition hover:bg-rizz-purple-dark disabled:opacity-50"
            aria-label="Like"
          >
            ♥
          </button>
        </div>
      )}

      {matchedWith && (
        <MatchModal profile={matchedWith} onClose={() => setMatchedWith(null)} />
      )}
    </div>
  )
}
