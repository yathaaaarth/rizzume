import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Other']
const SENIORITIES = ['Entry-level', 'Mid-level', 'Senior', 'Manager', 'Director', 'Executive/Founder']

export function Onboarding() {
  const { user } = useAuth()
  const { profile, loading, refresh } = useProfile()
  const navigate = useNavigate()

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
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
  }, [profile])

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

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
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
        is_complete: true,
      })

      if (upsertError) throw upsertError

      await refresh()
      navigate('/discover')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving your profile.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="px-4 py-20 text-center text-ink/60">Loading your profile…</div>
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Build your profile</h1>
      <p className="mt-2 text-ink/60">
        This is what other professionals see. Be real &mdash; the title and company are the flex.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Full name
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Birthdate
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="New York, NY"
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            I am a
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            >
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Interested in
            <select
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            >
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

        <label className="flex flex-col gap-1 text-sm font-medium">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="What's your deal, beyond the job title?"
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Company
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Job title
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Industry
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Tech, Finance, Law…"
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Seniority
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
            >
              <option value="">Select</option>
              {SENIORITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
            className="rounded-xl border border-ink/15 px-4 py-2.5 outline-none focus:border-rizz-purple"
          />
        </label>

        {existingPhotos.length > 0 && (
          <div className="flex gap-2">
            {existingPhotos.map((url) => (
              <img key={url} src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-rizz-coral">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-rizz-purple disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save & start swiping'}
        </button>
      </form>
    </div>
  )
}
