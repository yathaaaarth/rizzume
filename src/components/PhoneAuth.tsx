import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const inputClass = 'rounded-2xl border-3 border-ink bg-white px-4 py-2.5 outline-none focus:border-grape'

export function PhoneAuth() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone })
    setSubmitting(false)
    if (otpError) {
      setError(otpError.message)
      return
    }
    setStep('code')
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    setSubmitting(false)
    if (verifyError) {
      setError(verifyError.message)
      return
    }
    navigate('/playground')
  }

  return (
    <div className="flex flex-col gap-2">
      {step === 'phone' ? (
        <form onSubmit={sendCode} className="flex gap-2">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 555 5555"
            className={`${inputClass} flex-1`}
          />
          <button type="submit" disabled={submitting} className="sticker-btn bg-white px-4 text-sm font-bold disabled:opacity-50">
            {submitting ? '…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex gap-2">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className={`${inputClass} flex-1`}
          />
          <button type="submit" disabled={submitting} className="sticker-btn bg-grape px-4 text-sm font-bold text-white disabled:opacity-50">
            {submitting ? '…' : 'Verify'}
          </button>
        </form>
      )}
      {error && <p className="text-xs font-bold text-coral">{error}</p>}
      <p className="text-center text-[11px] text-ink/40">Needs an SMS provider enabled in Supabase Auth settings.</p>
    </div>
  )
}
