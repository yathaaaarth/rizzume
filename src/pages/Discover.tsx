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

export function Discover() {
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
          <h1 className="font-display text-2xl font-bold">Discover</h1>
          <p className="mt-1 text-sm text-ink/60">Verified professionals near you.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/likes"
            className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:border-rizz-purple hover:text-rizz-purple"
          >
            Likes
          </Link>
          <button
            onClick={() => setShowFilters(true)}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:border-rizz-purple hover:text-rizz-purple"
          >
            Filters
          </button>
        </div>
      </div>

      <div className="mt-6 h-[520px] w-full">
        {loading || myProfileLoading ? (
          <div className="flex h-full items-center justify-center text-ink/50">
            Finding people worth your time…
          </div>
        ) : current ? (
          <SwipeCard profile={current} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-ink/20 text-center text-ink/50">
            <p className="font-semibold">You're all caught up</p>
            <p className="text-sm">Try widening your filters, or check back later.</p>
          </div>
        )}
      </div>

      {current && (
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleRewind}
            disabled={!lastSwipe || busy}
            aria-label="Rewind"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink/15 text-lg text-ink/50 shadow-sm transition hover:border-rizz-lime hover:text-ink disabled:opacity-30"
          >
            ↺
          </button>
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

      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {matchedWith && myProfile && (
        <MatchModal me={myProfile} profile={matchedWith} onClose={() => setMatchedWith(null)} />
      )}
    </div>
  )
}
