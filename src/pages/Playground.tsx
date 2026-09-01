import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_FILTERS, FilterPanel, type Filters } from '../components/FilterPanel'
import { MatchModal } from '../components/MatchModal'
import { PalAvatar } from '../components/PalAvatar'
import { ResumeCard } from '../components/ResumeCard'
import { RizzCard } from '../components/RizzCard'
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
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [sendingOffers, setSendingOffers] = useState(false)
  const [matchedProfiles, setMatchedProfiles] = useState<Profile[] | null>(null)
  const [viewingRizzCard, setViewingRizzCard] = useState<Profile | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

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
      .order('rizz_points', { ascending: false })
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
    setShortlistedIds(new Set())
    setLoading(false)
  }, [user, myProfile, filters])

  useEffect(() => {
    if (!myProfileLoading) loadCandidates()
  }, [loadCandidates, myProfileLoading])

  const handlePass = async (candidate: Profile) => {
    if (!user) return
    await supabase.from('swipes').insert({ swiper_id: user.id, swiped_id: candidate.id, direction: 'pass' })
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
    setShortlistedIds((prev) => {
      const next = new Set(prev)
      next.delete(candidate.id)
      return next
    })
  }

  const handleToggleShortlist = (candidate: Profile) => {
    setShortlistedIds((prev) => {
      const next = new Set(prev)
      if (next.has(candidate.id)) next.delete(candidate.id)
      else next.add(candidate.id)
      return next
    })
  }

  const handleSendOffers = async () => {
    if (!user || shortlistedIds.size === 0 || sendingOffers) return
    setSendingOffers(true)

    const shortlisted = candidates.filter((c) => shortlistedIds.has(c.id))
    const newMatches: Profile[] = []

    for (const candidate of shortlisted) {
      await supabase.from('swipes').insert({ swiper_id: user.id, swiped_id: candidate.id, direction: 'like' })

      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user_a.eq.${user.id},user_b.eq.${candidate.id}),and(user_a.eq.${candidate.id},user_b.eq.${user.id})`)
        .maybeSingle()

      if (match) newMatches.push(candidate)
    }

    setCandidates((prev) => prev.filter((c) => !shortlistedIds.has(c.id)))
    setShortlistedIds(new Set())
    setSendingOffers(false)
    if (newMatches.length > 0) setMatchedProfiles(newMatches)
  }

  const shortlistedProfiles = candidates.filter((c) => shortlistedIds.has(c.id))

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-32">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">The Hiring Pipeline 📋</h1>
          <p className="mt-1 text-sm text-ink/60">Shortlist a few pals, then send offers.</p>
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

      {loading || myProfileLoading ? (
        <p className="mt-10 text-center text-ink/50">Rounding up some pals…</p>
      ) : candidates.length === 0 ? (
        <div className="sticker-card mt-10 flex flex-col items-center gap-2 border-dashed p-10 text-center text-ink/50">
          <p className="font-display text-lg font-bold">Pipeline's empty!</p>
          <p className="text-sm">Try loosening the rules, or check back later.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <ResumeCard
              key={candidate.id}
              profile={candidate}
              shortlisted={shortlistedIds.has(candidate.id)}
              onToggleShortlist={() => handleToggleShortlist(candidate)}
              onPass={() => handlePass(candidate)}
              onViewRizzCard={() => setViewingRizzCard(candidate)}
            />
          ))}
        </div>
      )}

      {shortlistedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-3 border-ink bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <div className="flex -space-x-3">
              {shortlistedProfiles.slice(0, 5).map((p) => (
                <div key={p.id} className="rounded-full border-3 border-cream">
                  <PalAvatar species={p.pal_species} primary={p.pal_color} accent={p.pal_accent} size={36} />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold">{shortlistedIds.size} shortlisted</p>
            <button
              onClick={handleSendOffers}
              disabled={sendingOffers}
              className="sticker-btn ml-auto bg-grape px-6 py-2.5 font-display font-bold text-white disabled:opacity-50"
            >
              {sendingOffers ? 'Sending…' : '📨 Send offers'}
            </button>
          </div>
        </div>
      )}

      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {viewingRizzCard && <RizzCard profile={viewingRizzCard} onClose={() => setViewingRizzCard(null)} />}

      {matchedProfiles && matchedProfiles.length === 1 && myProfile && (
        <MatchModal me={myProfile} profile={matchedProfiles[0]} onClose={() => setMatchedProfiles(null)} />
      )}

      {matchedProfiles && matchedProfiles.length > 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="sticker-card animate-pop-in flex max-w-sm flex-col items-center bg-white p-8 text-center">
            <span className="sticker-btn bg-sunshine px-4 py-1 text-xs font-bold uppercase tracking-widest">
              {matchedProfiles.length} new pals!
            </span>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {matchedProfiles.map((p) => (
                <PalAvatar key={p.id} species={p.pal_species} primary={p.pal_color} accent={p.pal_accent} size={56} />
              ))}
            </div>
            <p className="mt-4 text-ink/70">Everyone here offered you a spot too. Head to your Dens and say hi.</p>
            <div className="mt-6 flex w-full gap-3">
              <button
                onClick={() => setMatchedProfiles(null)}
                className="sticker-btn flex-1 bg-white px-4 py-2.5 font-bold"
              >
                Keep hiring
              </button>
              <Link
                to="/pals"
                className="sticker-btn flex-1 bg-grape px-4 py-2.5 text-center font-bold text-white"
                onClick={() => setMatchedProfiles(null)}
              >
                View Pals
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
