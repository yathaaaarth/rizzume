import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'
  }`

export function Navbar() {
  const { session, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-xl font-bold tracking-tight text-rizz-purple">
          Rizzume
        </span>

        {session && (
          <nav className="flex items-center gap-2">
            <NavLink to="/discover" className={linkClasses}>
              Discover
            </NavLink>
            <NavLink to="/matches" className={linkClasses}>
              Matches
            </NavLink>
            <NavLink to="/profile" className={linkClasses}>
              Profile
            </NavLink>
            <button
              onClick={() => signOut()}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink/50 hover:text-rizz-coral"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
