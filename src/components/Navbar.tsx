import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `sticker-btn px-4 py-2 text-sm font-bold ${isActive ? 'bg-sunshine' : 'bg-white'}`

export function Navbar() {
  const { session, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b-3 border-ink bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-2xl font-bold tracking-tight text-grape">Rizzume</span>

        {session && (
          <nav className="flex items-center gap-2">
            <NavLink to="/playground" className={linkClasses}>
              🎠 Playground
            </NavLink>
            <NavLink to="/fan-mail" className={linkClasses}>
              💌 Fan mail
            </NavLink>
            <NavLink to="/pals" className={linkClasses}>
              🐾 Pals
            </NavLink>
            <NavLink to="/profile" className={linkClasses}>
              🧸 My Pal
            </NavLink>
            <button onClick={() => signOut()} className="px-3 py-2 text-sm font-bold text-ink/50 hover:text-coral">
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
