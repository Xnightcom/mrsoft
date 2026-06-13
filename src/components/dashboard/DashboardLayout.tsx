import React from 'react'

interface Props {
  profile?: any
  children: React.ReactNode
}

export function DashboardLayout({ 
  profile, children 
}: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: '#0A0A0A',
        borderRight: '1px solid rgba(26,107,26,0.3)',
        padding: '24px 16px',
        position: 'fixed',
        top: 0, left: 0,
        height: '100vh'
      }}>
        <p style={{ color: 'white', fontWeight: 700 }}>
          MRsoft
        </p>
        <p style={{ 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: 12,
          marginTop: 8
        }}>
          {profile?.full_name}
        </p>
      </aside>

      {/* Main content */}
      <main style={{ 
        marginLeft: 240, 
        flex: 1,
        background: '#060606',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  )
}
