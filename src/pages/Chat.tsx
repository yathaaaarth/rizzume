import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../hooks/useProfile'
import { REPORT_REASONS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type Message = Tables<'messages'>

const COFFEE_MESSAGE = "☕ Want to grab a coffee chat this week?"

export function Chat() {
  const { matchId } = useParams<{ matchId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
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
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
        setOtherProfile(profile)
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      setMessages(msgs ?? [])
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!user || !matchId || !content.trim()) return
    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content: content.trim(),
    })
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
    navigate('/matches')
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
    if (matchId) {
      await supabase.from('matches').delete().eq('id', matchId)
    }

    navigate('/matches')
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-6">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/matches" className="text-ink/50 hover:text-ink">
            ←
          </Link>
          <h1 className="font-display text-xl font-bold">{otherProfile?.full_name ?? 'Chat'}</h1>
          {otherProfile?.company_verified && <span title="Verified company email">✓</span>}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full px-2 py-1 text-lg text-ink/50 hover:text-ink"
            aria-label="More options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg">
              <button
                onClick={handleUnmatch}
                disabled={actionBusy}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-ink/5 disabled:opacity-50"
              >
                Unmatch
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setReportOpen(true)
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-rizz-coral hover:bg-ink/5"
              >
                Block &amp; report
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <p className="text-ink/50">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-10 text-center text-sm text-ink/50">
            <p>Say hi to {otherProfile?.full_name ?? 'your match'} first.</p>
            <button
              onClick={() => sendMessage(COFFEE_MESSAGE)}
              className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 hover:border-rizz-purple hover:text-rizz-purple"
            >
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
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? 'ml-auto bg-rizz-purple text-white' : 'mr-auto bg-ink/5 text-ink'
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

      <form onSubmit={handleSend} className="flex gap-2 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={() => sendMessage(COFFEE_MESSAGE)}
          aria-label="Suggest a coffee chat"
          className="rounded-full border border-ink/15 px-3 text-lg"
        >
          ☕
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-ink px-6 py-2.5 font-semibold text-paper disabled:opacity-40"
        >
          Send
        </button>
      </form>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-paper p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold">Block &amp; report</h2>
            <p className="mt-1 text-sm text-ink/60">
              {otherProfile?.full_name} won't be able to see or message you again.
            </p>

            <label className="mt-4 flex flex-col gap-1 text-sm font-medium">
              Reason
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 flex flex-col gap-1 text-sm font-medium">
              Details (optional)
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
              />
            </label>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setReportOpen(false)}
                className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockAndReport}
                disabled={actionBusy}
                className="flex-1 rounded-full bg-rizz-coral px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
