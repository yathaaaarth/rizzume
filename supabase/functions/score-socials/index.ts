// Scores a user's self-reported socials + blurb into "rizz points".
//
// Important: this never scrapes Instagram/LinkedIn/Letterboxd/Goodreads. Those
// platforms prohibit scraping in their terms of service, and there is no public
// API for most of them. All this function ever sees is text the user typed
// themselves (which links they say they have, plus a short blurb) — the model
// is scoring how the user described themselves, not verifying or reading their
// actual social content.
//
// Requires the ANTHROPIC_API_KEY secret to be set on the project
// (`supabase secrets set ANTHROPIC_API_KEY=...`). Without it, falls back to a
// simple heuristic so the feature still works, just less cleverly.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type SocialInput = {
  instagram_handle?: string | null
  linkedin_url?: string | null
  letterboxd_url?: string | null
  goodreads_url?: string | null
  social_blurb?: string | null
}

function heuristicScore(input: SocialInput) {
  const filledLinks = [input.instagram_handle, input.linkedin_url, input.letterboxd_url, input.goodreads_url].filter(
    (v) => v && v.trim(),
  ).length
  const blurbLen = (input.social_blurb ?? '').trim().length

  let score = filledLinks * 15
  score += blurbLen > 100 ? 25 : blurbLen > 30 ? 15 : blurbLen > 0 ? 5 : 0
  score = Math.min(score, 100)

  return {
    score,
    breakdown: [
      { label: 'Links shared', note: `${filledLinks} platform${filledLinks === 1 ? '' : 's'} linked` },
      { label: 'Blurb', note: blurbLen > 0 ? 'Wrote something about themselves' : 'No blurb yet' },
    ],
    source: 'heuristic' as const,
  }
}

async function aiScore(input: SocialInput, apiKey: string) {
  const prompt = `You are scoring a dating-app profile's "social presence" section for a fun
"rizz points" feature (0-100). You are NOT given any real social media content —
only what the user typed into a form about their own accounts. Score based on:
completeness (did they share multiple platforms), and how engaging/specific
their written blurb is (specific and personal beats generic or empty). Be
generous and encouraging in tone, this is a lighthearted feature, not a
background check. Never claim to know anything about their actual posts.

Submitted data:
Instagram: ${input.instagram_handle || '(not provided)'}
LinkedIn: ${input.linkedin_url || '(not provided)'}
Letterboxd: ${input.letterboxd_url || '(not provided)'}
Goodreads: ${input.goodreads_url || '(not provided)'}
Blurb: ${input.social_blurb || '(not provided)'}

Respond with ONLY valid JSON, no other text, in this exact shape:
{"score": <integer 0-100>, "breakdown": [{"label": "<short label>", "note": "<one short sentence>"}]}
Include 2-4 breakdown items.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse AI response as JSON')

  const parsed = JSON.parse(jsonMatch[0])
  const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
  return { score, breakdown: parsed.breakdown ?? [], source: 'ai' as const }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Identify the caller using their own JWT (never trust a client-supplied user id).
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      })
    }

    const input: SocialInput = await req.json()
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    const result = apiKey ? await aiScore(input, apiKey).catch(() => heuristicScore(input)) : heuristicScore(input)

    // Service-role client bypasses the column-level grant we revoked from
    // `authenticated`, since only this function should ever set rizz_points.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        rizz_points: result.score,
        social_score_breakdown: result.breakdown,
        social_scored_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    })
  }
})
