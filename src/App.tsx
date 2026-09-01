import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Den } from './pages/Den'
import { FanMail } from './pages/FanMail'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Onboarding } from './pages/Onboarding'
import { Pals } from './pages/Pals'
import { Playground } from './pages/Playground'
import { Signup } from './pages/Signup'

export function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playground"
          element={
            <ProtectedRoute>
              <Playground />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pals"
          element={
            <ProtectedRoute>
              <Pals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fan-mail"
          element={
            <ProtectedRoute>
              <FanMail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/den/:matchId"
          element={
            <ProtectedRoute>
              <Den />
            </ProtectedRoute>
          }
        />

        {/* Redirects from the old swipe-app naming */}
        <Route path="/discover" element={<Navigate to="/playground" replace />} />
        <Route path="/matches" element={<Navigate to="/pals" replace />} />
        <Route path="/likes" element={<Navigate to="/fan-mail" replace />} />
        <Route path="/chat/:matchId" element={<ChatRedirect />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function ChatRedirect() {
  const path = window.location.pathname.replace('/chat/', '/den/')
  return <Navigate to={path} replace />
}
