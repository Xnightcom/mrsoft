import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import ClientDashboardContent from '@/components/dashboard/client/ClientDashboardContent'

export const Route = createFileRoute('/_authenticated/dashboard/client/')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/auth' })
  },
  component: ClientDashboardContent,
})
