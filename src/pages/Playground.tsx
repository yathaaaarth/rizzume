import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_FILTERS, FilterPanel, type Filters } from '../components/FilterPanel'
import { MatchModal } from '../components/MatchModal'
import { SwipeCard } from '../components/SwipeCard'
import { useAuth } from '../context/AuthContext'
import { useProfile, type Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

function yearsAgo(years: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().slice(0, 10)
}

export function Playground() {
  const { user } = useAuth()
  const { profile: myProfile, loading: myProfileLoading } = useProfile()
  const [candidates, setCandidates] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [matchedWith, setMatchedWith] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [lastSwipe, setLastSwipe] = useState<{ swipeId: string; matchId: string | null; profile: Profile } | null>(
    null,
  )

  const loadCandidates = useCallback(async () => {
    if (!user || !myProfile) return
    setLoading(true)

    const [{ data: mySwipes }, { data: myBlocks }] = await Promise.all([
      supabase.from('swipes').select('swiped_id').eq('swiper_id', user.id),
      supabase.from('blocks').select('blocker_id, blocked_id').or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
    ])

    const excludedIds = new Set<string>([user.id])
    for (const s of mySwipes ?? []) excludedIds.add(s.swiped_id)
    for (const b of myBlocks ?? []) {
      excludedIds.add(b.blocker_id === user.id ? b.blocked_id : b.blocker_id)
    }

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_complete', true)
      .eq('is_paused', false)
      .gte('birthdate', yearsAgo(filters.ageMax + 1))
      .lte('birthdate', yearsAgo(filters.ageMin))
      .limit(30)

    if (excludedIds.size > 0) {
      query = query.not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
    }

    if (myProfile.interested_in && myProfile.interested_in !== 'Everyone') {
      query = query.eq('gender', myProfile.interested_in)
    }
    if (myProfile.gender) {
      query = query.or(
        `interested_in.is.null,interested_in.eq.Everyone,interested_in.eq.${myProfile.gender}`,
      )
    }

    if (filters.industries.length > 0) {
      query = query.in('industry', filters.industries)
    }
    if (filters.seniorities.length > 0) {
      query = query.in('seniority', filters.seniorities)
    }
    if (filters.verifiedOnly) {
      query = query.eq('company_verified', true)
    }
    if (myProfile.hide_same_company && myProfile.company_domain) {
      query = query.or(`company_domain.is.null,company_domain.neq.${myProfile.company_domain}`)
    }

    const { data } = await query
    setCandidates(data ?? [])
    setLoading(false)
  }, [user, myProfile, filters])

  useEffect(() => {
    if (!myProfileLoading) loadCandidates()
  }, [loadCandidates, myProfileLoading])

  const current = candidates[0]

  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (!user || !current || busy) return
    setBusy(true)

    const { data: swipeRow } = await supabase
      .from('swipes')
      .insert({ swiper_id: user.id, swiped_id: current.id, direction })
      .select('id')
      .single()

    let createdMatchId: string | null = null

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
        createdMatchId = match.id
      }
    }

    setLastSwipe(swipeRow ? { swipeId: swipeRow.id, matchId: createdMatchId, profile: current } : null)
    setCandidates((prev) => prev.slice(1))
    setBusy(false)
  }

  const handleRewind = async () => {
    if (!lastSwipe || busy) return
    setBusy(true)

    if (lastSwipe.matchId) {
      await supabase.from('matches').delete().eq('id', lastSwipe.matchId)
    }
    await supabase.from('swipes').delete().eq('id', lastSwipe.swipeId)

    setCandidates((prev) => [lastSwipe.profile, ...prev])
    setLastSwipe(null)
    setBusy(false)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">The Playground 🎠</h1>
          <p className="mt-1 text-sm text-ink/60">Come meet some pals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/fan-mail" className="sticker-btn bg-white px-3 py-1.5 text-xs font-bold">
            💌 Fan mail
          </Link>
          <button onClick={() => setShowFilters(true)} className="sticker-btn bg-white px-3 py-1.5 text-xs font-bold">
            🎛️ Rules
          </button>
        </div>
      </div>

      <div className="mt-6 h-[520px] w-full">
        {loading || myProfileLoading ? (
          <div className="flex h-full items-center justify-center text-ink/50">Rounding up some pals…</div>
        ) : current ? (
          <SwipeCard profile={current} />
        ) : (
          <div className="sticker-card flex h-full flex-col items-center justify-center gap-2 border-dashed text-center text-ink/50">
            <p className="font-display text-lg font-bold">Recess is over!</p>
            <p className="text-sm">Try loosening the rules, or check back later.</p>
          </div>
        )}
      </div>

      {current && (
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleRewind}
            disabled={!lastSwipe || busy}
            aria-label="Rewind"
            className="sticker-btn flex h-12 w-12 items-center justify-center bg-white text-lg disabled:opacity-30"
          >
            ↺
          </button>
          <button
            onClick={() => handleSwipe('pass')}
            disabled={busy}
            className="sticker-btn flex h-16 w-16 items-center justify-center bg-white text-2xl disabled:opacity-50"
            aria-label="Walk away"
          >
            👋
          </button>
          <button
            onClick={() => handleSwipe('like')}
            disabled={busy}
            className="sticker-btn flex h-16 w-16 items-center justify-center bg-bubblegum text-2xl text-white disabled:opacity-50"
            aria-label="Wave hi"
          >
            🐾
          </button>
        </div>
      )}

      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {matchedWith && myProfile && (
        <MatchModal me={myProfile} profile={matchedWith} onClose={() => setMatchedWith(null)} />
      )}
    </div>
  )
}
