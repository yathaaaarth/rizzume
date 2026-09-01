import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PalAvatar } from '../components/PalAvatar'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../hooks/useProfile'
import { REPORT_REASONS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type Message = Tables<'messages'>
type DenItem = Tables<'den_items'>
type Placement = Tables<'den_placements'>

const COFFEE_MESSAGE = '☕ Want to grab a coffee chat this week?'
const GRID_COLS = 5
const GRID_ROWS = 3

export function Den() {
  const { matchId } = useParams<{ matchId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [items, setItems] = useState<DenItem[]>([])
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchId || !user) return

    const load = async () => {
      setLoading(true)

      const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single()
      if (match) {
        const otherId = match.user_a === user.id ? match.user_b : match.user_a
        const [{ data: other }, { data: mine }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', otherId).single(),
          supabase.from('profiles').select('*').eq('id', user.id).single(),
        ])
        setOtherProfile(other)
        setMyProfile(mine)
      }

      const [{ data: msgs }, { data: catalog }, { data: placed }] = await Promise.all([
        supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
        supabase.from('den_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('den_placements').select('*').eq('match_id', matchId),
      ])

      setMessages(msgs ?? [])
      setItems(catalog ?? [])
      setPlacements(placed ?? [])
      setLoading(false)
    }

    load()

    const messageChannel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe()

    const denChannel = supabase
      .channel(`den:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'den_placements', filter: `match_id=eq.${matchId}` },
        (payload) => setPlacements((prev) => [...prev, payload.new as Placement]),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'den_placements', filter: `match_id=eq.${matchId}` },
        (payload) => setPlacements((prev) => prev.filter((p) => p.id !== (payload.old as Placement).id)),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(denChannel)
    }
  }, [matchId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const unlockedKeys = new Set(items.filter((i) => i.unlock_at_messages <= messages.length).map((i) => i.key))
  const placedByCell = new Map(placements.map((p) => [`${p.x},${p.y}`, p]))
  const itemByKey = new Map(items.map((i) => [i.key, i]))
  const palColorByUser = new Map([
    ...(myProfile ? [[myProfile.id, myProfile.pal_color] as const] : []),
    ...(otherProfile ? [[otherProfile.id, otherProfile.pal_color] as const] : []),
  ])

  const placeItem = async (x: number, y: number) => {
    if (!user || !matchId) return
    const cellKey = `${x},${y}`
    const existing = placedByCell.get(cellKey)

    if (existing) {
      await supabase.from('den_placements').delete().eq('id', existing.id)
      return
    }

    if (!selectedItem) return
    const { data } = await supabase
      .from('den_placements')
      .insert({ match_id: matchId, item_key: selectedItem, x, y, placed_by: user.id })
      .select('*')
      .single()
    if (data) setPlacements((prev) => [...prev, data])
  }

  const sendMessage = async (content: string) => {
    if (!user || !matchId || !content.trim()) return
    await supabase.from('messages').insert({ match_id: matchId, sender_id: user.id, content: content.trim() })
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    const content = draft.trim()
    setDraft('')
    await sendMessage(content)
  }

  const handleUnmatch = async () => {
    if (!matchId || actionBusy) return
    setActionBusy(true)
    await supabase.from('matches').delete().eq('id', matchId)
    navigate('/pals')
  }

  const handleBlockAndReport = async () => {
    if (!user || !otherProfile || actionBusy) return
    setActionBusy(true)

    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherProfile.id })
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: otherProfile.id,
      reason: reportReason,
      details: reportDetails || null,
    })
    if (matchId) await supabase.from('matches').delete().eq('id', matchId)

    navigate('/pals')
  }

  if (loading) {
    return <div className="px-4 py-20 text-center text-ink/60">Setting up your den…</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between border-b-3 border-ink/10 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/pals" className="text-ink/50 hover:text-ink">
            ←
          </Link>
          {otherProfile && (
            <PalAvatar species={otherProfile.pal_species} primary={otherProfile.pal_color} accent={otherProfile.pal_accent} size={40} />
          )}
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">
              {otherProfile?.pal_name || otherProfile?.full_name || 'Den'}
              {otherProfile?.company_verified && <span className="ml-1 text-grape">✓</span>}
            </h1>
            <p className="text-xs text-ink/50">{otherProfile?.full_name}</p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="rounded-full px-2 py-1 text-lg text-ink/50 hover:text-ink" aria-label="More options">
            ⋯
          </button>
          {menuOpen && (
            <div className="sticker-card absolute right-0 z-10 mt-2 w-48 overflow-hidden bg-white">
              <button onClick={handleUnmatch} disabled={actionBusy} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-cream disabled:opacity-50">
                Unmatch
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setReportOpen(true)
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-coral hover:bg-cream"
              >
                Block &amp; report
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sticker-card mt-4 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Your Den 🏠</h2>
          <span className="text-xs font-bold text-ink/50">{messages.length} messages · next sticker unlocks soon</span>
        </div>

        <div
          className="mt-3 grid gap-1.5 rounded-2xl border-3 border-ink bg-sky/20 p-2"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
        >
          {Array.from({ length: GRID_ROWS }).map((_, y) =>
            Array.from({ length: GRID_COLS }).map((_, x) => {
              const cell = placedByCell.get(`${x},${y}`)
              const item = cell ? itemByKey.get(cell.item_key) : null
              const placerColor = cell ? palColorByUser.get(cell.placed_by) : undefined
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => placeItem(x, y)}
                  className="flex aspect-square items-center justify-center rounded-xl border-2 bg-white text-xl transition hover:scale-105"
                  style={{ borderColor: placerColor ?? '#2B214020' }}
                  aria-label={item ? `Remove ${item.label}` : 'Empty spot'}
                >
                  {item?.emoji}
                </button>
              )
            }),
          )}
        </div>

        <p className="mt-2 text-xs text-ink/50">
          {selectedItem ? 'Tap an empty spot to place it.' : 'Pick a sticker below, then tap a spot in the den.'}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => {
            const unlocked = unlockedKeys.has(item.key)
            return (
              <button
                key={item.key}
                type="button"
                disabled={!unlocked}
                onClick={() => setSelectedItem((prev) => (prev === item.key ? null : item.key))}
                className={`sticker-btn px-3 py-1.5 text-sm font-bold ${
                  selectedItem === item.key ? 'bg-sunshine' : 'bg-white'
                } ${!unlocked ? 'opacity-30' : ''}`}
                title={unlocked ? item.label : `Unlocks at ${item.unlock_at_messages} messages`}
              >
                {unlocked ? item.emoji : '🔒'} {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="sticker-card mt-4 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '40vh' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-4 text-center text-sm text-ink/50">
              <p>Say hi to {otherProfile?.pal_name || otherProfile?.full_name || 'your new pal'} first.</p>
              <button onClick={() => sendMessage(COFFEE_MESSAGE)} className="sticker-btn bg-white px-4 py-2 text-xs font-bold">
                ☕ Suggest a coffee chat
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const mine = m.sender_id === user?.id
                return (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl border-2 border-ink px-4 py-2 text-sm ${
                      mine ? 'ml-auto bg-grape text-white' : 'mr-auto bg-cream text-ink'
                    }`}
                  >
                    {m.content}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t-3 border-ink/10 p-4">
          <button type="button" onClick={() => sendMessage(COFFEE_MESSAGE)} aria-label="Suggest a coffee chat" className="sticker-btn bg-white px-3 text-lg">
            ☕
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full border-3 border-ink px-4 py-2.5 outline-none focus:border-grape"
          />
          <button type="submit" disabled={!draft.trim()} className="sticker-btn bg-ink px-6 font-bold text-paper disabled:opacity-40">
            Send
          </button>
        </form>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="sticker-card w-full max-w-sm bg-white p-6">
            <h2 className="font-display text-xl font-bold">Block &amp; report</h2>
            <p className="mt-1 text-sm text-ink/60">
              {otherProfile?.full_name} won't be able to see or message you again.
            </p>

            <label className="mt-4 flex flex-col gap-1 text-sm font-bold">
              Reason
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="rounded-2xl border-3 border-ink px-4 py-2.5 outline-none focus:border-grape"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 flex flex-col gap-1 text-sm font-bold">
              Details (optional)
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="rounded-2xl border-3 border-ink px-4 py-2.5 outline-none focus:border-grape"
              />
            </label>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setReportOpen(false)} className="sticker-btn flex-1 bg-white py-2.5 text-sm font-bold">
                Cancel
              </button>
              <button
                onClick={handleBlockAndReport}
                disabled={actionBusy}
                className="sticker-btn flex-1 bg-coral py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Block &amp; report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
