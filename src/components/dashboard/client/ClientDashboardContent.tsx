import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import DashboardLayout from '../DashboardLayout'

export default function ClientDashboardContent() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hard timeout - ALWAYS stop loading after 5s
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user
      if (!user) {
        clearTimeout(timeout)
        setLoading(false)
        return
      }

      supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: prof }) => {
          clearTimeout(timeout)
          setProfile(prof ?? { 
            full_name: user.email, 
            role: 'client' 
          })
          setLoading(false)
        })
        .catch(() => {
          clearTimeout(timeout)
          setLoading(false)
        })
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#060606',
        color: 'white',
        gap: '16px'
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #CC0000',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading dashboard...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <DashboardLayout profile={profile}>
      <div style={{ color: 'white', padding: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Welcome back, {profile?.full_name ?? 'User'} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
          Client Dashboard — {new Date().toDateString()}
        </p>

        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginTop: 32
        }}>
          {[
            { label: 'Active Projects', value: '0' },
            { label: 'Pending Invoices', value: '0' },
            { label: 'Unread Messages', value: '0' },
          ].map(card => (
            <div key={card.label} style={{
              background: '#0F0F0F',
              border: '1px solid rgba(26,107,26,0.3)',
              borderRadius: 12,
              padding: 24
            }}>
              <p style={{ 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: 14 
              }}>
                {card.label}
              </p>
              <p style={{ 
                fontSize: 40, 
                fontWeight: 700,
                color: 'white'
              }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
