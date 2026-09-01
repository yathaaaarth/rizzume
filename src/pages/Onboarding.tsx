import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PAL_SPECIES, PalAvatar } from '../components/PalAvatar'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { GENDERS, INDUSTRIES, PAL_COLORS, PROMPT_BANK, SENIORITIES } from '../lib/constants'
import { calculateRizzScore, rizzLabel } from '../lib/rizzScore'
import { supabase } from '../lib/supabase'

type PromptAnswer = { question: string; answer: string }

const EMPTY_PROMPTS: PromptAnswer[] = [
  { question: PROMPT_BANK[0], answer: '' },
  { question: PROMPT_BANK[1], answer: '' },
  { question: PROMPT_BANK[2], answer: '' },
]

const inputClass =
  'rounded-2xl border-3 border-ink bg-white px-4 py-2.5 outline-none focus:border-grape'

export function Onboarding() {
  const { user } = useAuth()
  const { profile, loading, refresh } = useProfile()
  const navigate = useNavigate()

  const [palName, setPalName] = useState('')
  const [palSpecies, setPalSpecies] = useState(PAL_SPECIES[0].key as string)
  const [palColorIdx, setPalColorIdx] = useState(0)

  const [fullName, setFullName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [gender, setGender] = useState('')
  const [interestedIn, setInterestedIn] = useState('')
  const [bio, setBio] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [seniority, setSeniority] = useState('')
  const [location, setLocation] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [prompts, setPrompts] = useState<PromptAnswer[]>(EMPTY_PROMPTS)
  const [hideSameCompany, setHideSameCompany] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [instagramHandle, setInstagramHandle] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [letterboxdUrl, setLetterboxdUrl] = useState('')
  const [goodreadsUrl, setGoodreadsUrl] = useState('')
  const [socialBlurb, setSocialBlurb] = useState('')
  const [rizzPoints, setRizzPoints] = useState<number | null>(null)
  const [rizzBreakdown, setRizzBreakdown] = useState<{ label: string; note: string }[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setBirthdate(profile.birthdate ?? '')
    setGender(profile.gender ?? '')
    setInterestedIn(profile.interested_in ?? '')
    setBio(profile.bio ?? '')
    setCompany(profile.company ?? '')
    setJobTitle(profile.job_title ?? '')
    setIndustry(profile.industry ?? '')
    setSeniority(profile.seniority ?? '')
    setLocation(profile.location ?? '')
    setExistingPhotos(profile.photo_urls ?? [])
    setHideSameCompany(profile.hide_same_company ?? true)
    setIsPaused(profile.is_paused ?? false)
    setPalName(profile.pal_name ?? '')
    setPalSpecies(profile.pal_species ?? PAL_SPECIES[0].key)
    const matchedColor = PAL_COLORS.findIndex((c) => c.primary === profile.pal_color)
    setPalColorIdx(matchedColor >= 0 ? matchedColor : 0)

    const savedPrompts = Array.isArray(profile.prompts) ? (profile.prompts as unknown as PromptAnswer[]) : []
    if (savedPrompts.length > 0) {
      setPrompts([0, 1, 2].map((i) => savedPrompts[i] ?? EMPTY_PROMPTS[i]))
    }

    setInstagramHandle(profile.instagram_handle ?? '')
    setLinkedinUrl(profile.linkedin_url ?? '')
    setLetterboxdUrl(profile.letterboxd_url ?? '')
    setGoodreadsUrl(profile.goodreads_url ?? '')
    setSocialBlurb(profile.social_blurb ?? '')
    setRizzPoints(profile.rizz_points ?? null)
    const savedBreakdown = Array.isArray(profile.social_score_breakdown)
      ? (profile.social_score_breakdown as unknown as { label: string; note: string }[])
      : []
    setRizzBreakdown(savedBreakdown)
  }, [profile])

  const rizzScore = useMemo(
    () =>
      calculateRizzScore({
        photoCount: existingPhotos.length + photoFiles.length,
        bio,
        jobTitle,
        company,
        industry,
        promptCount: prompts.filter((p) => p.answer.trim()).length,
      }),
    [existingPhotos.length, photoFiles.length, bio, jobTitle, company, industry, prompts],
  )

  const palColor = PAL_COLORS[palColorIdx]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSubmitting(true)

    try {
      const uploadedUrls: string[] = []
      for (const file of photoFiles) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage.from('profile-photos').getPublicUrl(path)
        uploadedUrls.push(publicUrl.publicUrl)
      }

      const photoUrls = [...existingPhotos, ...uploadedUrls]
      const cleanPrompts = prompts.filter((p) => p.answer.trim())

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        pal_name: palName || null,
        pal_species: palSpecies,
        pal_color: palColor.primary,
        pal_accent: palColor.accent,
        birthdate: birthdate || null,
        gender: gender || null,
        interested_in: interestedIn || null,
        bio: bio || null,
        company: company || null,
        job_title: jobTitle || null,
        industry: industry || null,
        seniority: seniority || null,
        location: location || null,
        photo_urls: photoUrls,
        prompts: cleanPrompts,
        instagram_handle: instagramHandle || null,
        linkedin_url: linkedinUrl || null,
        letterboxd_url: letterboxdUrl || null,
        goodreads_url: goodreadsUrl || null,
        social_blurb: socialBlurb || null,
        hide_same_company: hideSameCompany,
        is_paused: isPaused,
        is_complete: true,
      })

      if (upsertError) throw upsertError

      await refresh()
      navigate('/playground')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving your profile.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnalyzeSocials = async () => {
    if (!user) return
    setAnalyzing(true)
    setAnalyzeError(null)

    try {
      // First save the links/blurb so they persist even if scoring fails.
      const { error: saveError } = await supabase
        .from('profiles')
        .update({
          instagram_handle: instagramHandle || null,
          linkedin_url: linkedinUrl || null,
          letterboxd_url: letterboxdUrl || null,
          goodreads_url: goodreadsUrl || null,
          social_blurb: socialBlurb || null,
        })
        .eq('id', user.id)
      if (saveError) throw saveError

      const { data, error: invokeError } = await supabase.functions.invoke('score-socials', {
        body: {
          instagram_handle: instagramHandle,
          linkedin_url: linkedinUrl,
          letterboxd_url: letterboxdUrl,
          goodreads_url: goodreadsUrl,
          social_blurb: socialBlurb,
        },
      })
      if (invokeError) throw invokeError

      setRizzPoints(data.score)
      setRizzBreakdown(data.breakdown ?? [])
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Could not score your socials right now.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return <div className="px-4 py-20 text-center text-ink/60">Loading your den…</div>
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Build your Pal</h1>
      <p className="mt-2 text-ink/60">
        This cutie fronts your profile. Your real details still live underneath, for when it's time to talk shop.
      </p>

      <div className="sticker-card mt-6 flex flex-col items-center gap-4 bg-white p-6">
        <PalAvatar species={palSpecies} primary={palColor.primary} accent={palColor.accent} size={140} />

        <input
          value={palName}
          onChange={(e) => setPalName(e.target.value)}
          placeholder="Name your pal (e.g. Biscuit)"
          className={`${inputClass} w-full text-center font-display text-lg`}
        />

        <div className="flex flex-wrap justify-center gap-2">
          {PAL_SPECIES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setPalSpecies(s.key)}
              className={`sticker-btn px-3 py-1.5 text-sm font-bold ${
                palSpecies === s.key ? 'bg-sunshine' : 'bg-white'
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {PAL_COLORS.map((c, idx) => (
            <button
              key={c.label}
              type="button"
              aria-label={c.label}
              onClick={() => setPalColorIdx(idx)}
              className={`h-9 w-9 rounded-full border-3 ${
                palColorIdx === idx ? 'border-ink' : 'border-white'
              }`}
              style={{ backgroundColor: c.primary, boxShadow: palColorIdx === idx ? '2px 2px 0 #2B2140' : undefined }}
            />
          ))}
        </div>
      </div>

      <div className="sticker-card mt-6 bg-white p-4">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Profile strength</span>
          <span className="text-grape">{rizzLabel(rizzScore)}</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
          <div
            className="h-full rounded-full bg-gradient-to-r from-grape to-sunshine transition-all"
            style={{ width: `${rizzScore}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-bold">
          Your real name
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-bold">
            Birthdate
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York, NY"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-bold">
            I am a
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Interested in
            <select value={interestedIn} onChange={(e) => setInterestedIn(e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value="Everyone">Everyone</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-bold">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="What's your deal, beyond the job title?"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-bold">
            Company
            <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Job title
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-bold">
            Industry
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Seniority
            <select value={seniority} onChange={(e) => setSeniority(e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {SENIORITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-bold">
          Photos (peeking-behind-the-pal reveal)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
            className={inputClass}
          />
        </label>

        {existingPhotos.length > 0 && (
          <div className="flex gap-2">
            {existingPhotos.map((url) => (
              <img key={url} src={url} alt="" className="h-20 w-20 rounded-2xl border-3 border-ink object-cover" />
            ))}
          </div>
        )}

        <div className="sticker-card flex flex-col gap-4 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Your socials</p>
            {rizzPoints !== null && (
              <span className="sticker-btn bg-sunshine px-3 py-1 text-xs font-bold">🔥 {rizzPoints} rizz points</span>
            )}
          </div>
          <p className="-mt-3 text-xs text-ink/50">
            Share your own links and a blurb about yourself &mdash; we score how you describe yourself, we don't
            scrape your accounts.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="Instagram @handle"
              className={`${inputClass} text-sm`}
            />
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="LinkedIn URL"
              className={`${inputClass} text-sm`}
            />
            <input
              value={letterboxdUrl}
              onChange={(e) => setLetterboxdUrl(e.target.value)}
              placeholder="Letterboxd URL"
              className={`${inputClass} text-sm`}
            />
            <input
              value={goodreadsUrl}
              onChange={(e) => setGoodreadsUrl(e.target.value)}
              placeholder="Goodreads / Kindle URL"
              className={`${inputClass} text-sm`}
            />
          </div>

          <textarea
            value={socialBlurb}
            onChange={(e) => setSocialBlurb(e.target.value)}
            rows={2}
            placeholder="Tell us about your taste — favorite films, what you're reading, your feed's whole vibe…"
            className={`${inputClass} text-sm`}
          />

          <button
            type="button"
            onClick={handleAnalyzeSocials}
            disabled={analyzing}
            className="sticker-btn self-start bg-grape px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : '✨ Analyze my rizz'}
          </button>

          {analyzeError && <p className="text-xs font-bold text-coral">{analyzeError}</p>}

          {rizzBreakdown.length > 0 && (
            <div className="flex flex-col gap-1">
              {rizzBreakdown.map((b, idx) => (
                <p key={idx} className="text-xs text-ink/60">
                  <span className="font-bold">{b.label}:</span> {b.note}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="sticker-card flex flex-col gap-4 bg-white p-4">
          <p className="text-sm font-bold">Prompts</p>
          <p className="-mt-3 text-xs text-ink/50">
            Pick a few conversation-starters. More interesting than "I like hiking."
          </p>
          {prompts.map((p, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <select
                value={p.question}
                onChange={(e) => {
                  const next = [...prompts]
                  next[idx] = { ...next[idx], question: e.target.value }
                  setPrompts(next)
                }}
                className={`${inputClass} text-sm`}
              >
                {PROMPT_BANK.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <input
                value={p.answer}
                onChange={(e) => {
                  const next = [...prompts]
                  next[idx] = { ...next[idx], answer: e.target.value }
                  setPrompts(next)
                }}
                placeholder="Your answer"
                className={`${inputClass} text-sm`}
              />
            </div>
          ))}
        </div>

        <div className="sticker-card flex flex-col gap-3 bg-white p-4">
          <label className="flex items-center justify-between gap-4 text-sm font-bold">
            <span>
              Hide people from my company
              <span className="block text-xs font-normal text-ink/50">
                Only works once your work email is verified.
              </span>
            </span>
            <input
              type="checkbox"
              checked={hideSameCompany}
              onChange={(e) => setHideSameCompany(e.target.checked)}
              className="h-5 w-5 accent-grape"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm font-bold">
            <span>
              Out of office
              <span className="block text-xs font-normal text-ink/50">
                Pause your pal &mdash; nobody sees you in the Playground.
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPaused}
              onChange={(e) => setIsPaused(e.target.checked)}
              className="h-5 w-5 accent-grape"
            />
          </label>
        </div>

        {error && <p className="text-sm font-bold text-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="sticker-btn mt-2 bg-grape px-6 py-3 font-display font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save & head to the Playground'}
        </button>
      </form>
    </div>
  )
}
