import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <span className="rounded-full bg-rizz-lime px-4 py-1 text-xs font-bold uppercase tracking-widest text-ink">
        Dating, for people who work
      </span>
      <h1 className="font-display mt-6 text-5xl font-bold leading-tight sm:text-6xl">
        Your résumé finally
        <br />
        has some <span className="text-rizz-purple">rizz</span>.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink/70">
        Rizzume is a dating app for working professionals. Verified companies, real job
        titles, no small talk about what you do &mdash; swipe, match, and skip straight to
        the good conversation.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          to="/signup"
          className="rounded-full bg-ink px-8 py-3 font-semibold text-paper transition hover:bg-rizz-purple"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="rounded-full border border-ink/20 px-8 py-3 font-semibold text-ink transition hover:border-ink"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
