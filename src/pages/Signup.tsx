import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    navigate('/onboarding')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-20">
      <h1 className="font-display text-3xl font-bold">Join Rizzume</h1>
      <p className="mt-2 text-ink/60">Bring your career. Leave the small talk behind.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Full name
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            placeholder="Jordan Lee"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Work or personal email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            placeholder="you@company.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            placeholder="At least 6 characters"
          />
        </label>

        {error && <p className="text-sm text-rizz-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-rizz-purple disabled:opacity-50"
        >
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-rizz-purple">
          Log in
        </Link>
      </p>
    </div>
  )
}
