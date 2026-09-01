import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    navigate('/discover')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-20">
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-ink/60">Your next match is one swipe away.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
          />
        </label>

        {error && <p className="text-sm text-rizz-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-rizz-purple disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        New to Rizzume?{' '}
        <Link to="/signup" className="font-semibold text-rizz-purple">
          Create an account
        </Link>
      </p>
    </div>
  )
}
