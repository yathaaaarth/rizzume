// Sends a welcome email when a new profile is created. Meant to be wired to a
// Supabase Database Webhook: Database → Webhooks → new webhook on
// public.profiles, event INSERT, HTTP request to this function's URL, with a
// custom header `x-webhook-secret: <WEBHOOK_SECRET>` matching the secret set
// below (`supabase secrets set WEBHOOK_SECRET=... RESEND_API_KEY=...`).
//
// Without RESEND_API_KEY set, this no-ops (logs and returns 200) rather than
// failing the webhook — signup should never be blocked by email delivery.

import { createClient } from 'jsr:@supabase/supabase-js@2'

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: { id: string; full_name?: string | null } | null
}

Deno.serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    if (webhookSecret && req.headers.get('x-webhook-secret') !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const payload: WebhookPayload = await req.json()
    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not set, skipping welcome email for', payload.record.id)
      return new Response(JSON.stringify({ skipped: true, reason: 'no email provider configured' }), { status: 200 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
    } = await adminClient.auth.admin.getUserById(payload.record.id)

    if (!user?.email) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no email on user' }), { status: 200 })
    }

    const fromAddress = Deno.env.get('WELCOME_EMAIL_FROM') || 'Rizzume <onboarding@resend.dev>'
    const name = payload.record.full_name || 'there'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: user.email,
        subject: 'Welcome to Rizzume 🐾',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h1 style="color: #8B5CF6;">Hey ${name}, welcome to Rizzume!</h1>
            <p>Your account is set up. Next: build your Pal, fill in your profile,
            and head to the Playground to start meeting people.</p>
            <p>See you in there 🐾</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      console.error('Resend API error:', res.status, await res.text())
      return new Response(JSON.stringify({ sent: false }), { status: 200 })
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 })
  } catch (err) {
    console.error('send-welcome-email error:', err)
    // Never fail the webhook over email issues.
    return new Response(JSON.stringify({ sent: false, error: String(err) }), { status: 200 })
  }
})
