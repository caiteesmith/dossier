import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error); return }
    navigate('/dashboard')
  }

  const iS = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--color-navy-200)', background: 'var(--color-fog)',
    fontSize: '14px', color: 'var(--color-navy-800)', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-navy-900)', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontStyle: 'italic', color: 'white', marginBottom: '4px' }}>
            Dossier
          </p>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)' }}>
            Wedding Studio
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy-900)', marginBottom: '4px' }}>
            Sign in
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-navy-400)', marginBottom: '24px' }}>
            Welcome back
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-navy-600)', marginBottom: '5px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                style={iS}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-navy-600)', marginBottom: '5px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={iS}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#b91c1c', background: '#fde8e8', padding: '10px 12px', borderRadius: '8px', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
                background: loading ? 'var(--color-navy-400)' : 'var(--color-navy-900)',
                color: 'white', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                marginTop: '4px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize: '12px', color: 'var(--color-navy-400)', textAlign: 'center', marginTop: '20px' }}>
            Don't have an account?{' '}
            <a href="mailto:hello@caiteesmith.com" style={{ color: 'var(--color-steel-500)', textDecoration: 'none' }}>
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}