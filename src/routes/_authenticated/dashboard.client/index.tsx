import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/_authenticated/dashboard/client/')({
  beforeLoad: async () => {
    const { data: { session } } = 
      await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/auth' })
  },
  component: () => (
    <div style={{
      minHeight: '100vh',
      background: '#060606',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
      fontWeight: 700
    }}>
      ✅ Client Dashboard is Working!
    </div>
  )
})
