import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Profile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

type Message = Tables<'messages'>

export function Chat() {
  const { matchId } = useParams<{ matchId: string }>()
  const { user } = useAuth()
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
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

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || !user || !matchId) return

    const content = draft.trim()
    setDraft('')

    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    })
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-6">
      <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
        <Link to="/matches" className="text-ink/50 hover:text-ink">
          ←
        </Link>
        <h1 className="font-display text-xl font-bold">
          {otherProfile?.full_name ?? 'Chat'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <p className="text-ink/50">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink/50">
            Say hi to {otherProfile?.full_name ?? 'your match'} first.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id
              return (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? 'ml-auto bg-rizz-purple text-white'
                      : 'mr-auto bg-ink/5 text-ink'
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
    </div>
  )
}
