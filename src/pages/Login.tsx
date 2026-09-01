import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PhoneAuth } from '../components/PhoneAuth'
import { SocialAuthButtons } from '../components/SocialAuthButtons'
import { supabase } from '../lib/supabase'

const inputClass = 'rounded-2xl border-3 border-ink bg-white px-4 py-2.5 outline-none focus:border-grape'

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

    navigate('/playground')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-20">
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-ink/60">Your pal missed you.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-bold">
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-bold">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && <p className="text-sm font-bold text-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="sticker-btn mt-2 bg-grape px-6 py-3 font-display font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6">
        <SocialAuthButtons />
      </div>

      <div className="mt-4">
        <PhoneAuth />
      </div>

      <p className="mt-6 text-sm text-ink/60">
        New to Rizzume?{' '}
        <Link to="/signup" className="font-bold text-grape">
          Create an account
        </Link>
      </p>
    </div>
  )
}
