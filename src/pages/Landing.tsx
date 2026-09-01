import { Link } from 'react-router-dom'
import { PalAvatar } from '../components/PalAvatar'

export function Landing() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
      <span className="sticker-btn bg-sunshine px-4 py-1 text-xs font-bold uppercase tracking-widest">
        Not another swipe app
      </span>

      <div className="mt-6 flex gap-2">
        <PalAvatar species="bear" primary="#8B5CF6" accent="#FFD93D" size={80} className="animate-pop-in" />
        <PalAvatar species="fox" primary="#FF6FB5" accent="#38BDF8" size={80} className="animate-pop-in" />
        <PalAvatar species="bunny" primary="#38BDF8" accent="#FFD93D" size={80} className="animate-pop-in" />
      </div>

      <h1 className="font-display mt-6 text-5xl font-bold leading-tight sm:text-6xl">
        Make a pal.
        <br />
        Build a <span className="text-grape">den</span>.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink/70">
        Rizzume is a dating app for working professionals &mdash; but it looks nothing like the others. Meet cute
        pixel pals, wave hello, and decorate a shared room together as you actually get to know each other.
        Verified companies, real job titles, zero cringe swipe decks.
      </p>
      <div className="mt-10 flex gap-4">
        <Link to="/signup" className="sticker-btn bg-grape px-8 py-3 font-display font-bold text-white">
          Get started
        </Link>
        <Link to="/login" className="sticker-btn bg-white px-8 py-3 font-display font-bold">
          Log in
        </Link>
      </div>
    </div>
  )
}
