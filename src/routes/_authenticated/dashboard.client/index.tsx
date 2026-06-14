import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import ClientDashboardContent from '@/components/dashboard/client/ClientDashboardContent'

export const Route = createFileRoute('/_authenticated/dashboard/client/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/auth' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    const role = profile?.role || 'client'
    if (role !== 'client' && role !== 'admin') {
      throw redirect({ to: `/dashboard/${role}` as any })
    }
  },
  component: ClientDashboardContent,
})
