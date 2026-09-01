import type { Profile } from '../hooks/useProfile'

export function calculateRizzScore(fields: {
  photoCount: number
  bio: string
  jobTitle: string
  company: string
  industry: string
  promptCount: number
}) {
  let score = 0
  score += Math.min(fields.photoCount, 3) * 12 // up to 36
  score += fields.bio.trim().length > 20 ? 20 : fields.bio.trim().length > 0 ? 8 : 0
  score += fields.jobTitle.trim() ? 12 : 0
  score += fields.company.trim() ? 12 : 0
  score += fields.industry.trim() ? 8 : 0
  score += Math.min(fields.promptCount, 3) * 4 // up to 12
  return Math.min(score, 100)
}

export function rizzLabel(score: number) {
  if (score >= 90) return 'Certified rizz'
  if (score >= 70) return 'Strong aura'
  if (score >= 45) return 'Getting there'
  return 'NPC mode — add more'
}

export function calculateAge(birthdate: string | null) {
  if (!birthdate) return null
  const dob = new Date(birthdate)
  const diff = Date.now() - dob.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export function matchReasons(me: Profile, other: Profile) {
  const reasons: string[] = []

  if (me.industry && other.industry && me.industry === other.industry) {
    reasons.push(`Both in ${me.industry}`)
  }
  if (
    me.location &&
    other.location &&
    me.location.trim().toLowerCase() === other.location.trim().toLowerCase()
  ) {
    reasons.push(`Both based in ${me.location}`)
  }
  if (me.seniority && other.seniority && me.seniority === other.seniority) {
    reasons.push(`Both ${me.seniority}`)
  }
  if (me.company_verified && other.company_verified) {
    reasons.push('Both verified professionals')
  }

  return reasons
}
