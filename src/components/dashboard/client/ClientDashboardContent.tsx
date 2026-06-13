import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { DashboardLayout } from '../DashboardLayout'
import { Briefcase, FileDigit, MessageSquare, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { StatCard } from '../StatCard'

export default function ClientDashboardContent() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    projects: 0,
    invoices: 0,
    messages: 0
  })
  const [activeProjects, setActiveProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hard timeout - ALWAYS stop loading after 5s
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    async function loadDashboardData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData?.session?.user
        if (!user) {
          clearTimeout(timeout)
          setLoading(false)
          return
        }

        // 1. Load Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        const activeProfile = prof ?? { full_name: user.email, role: 'client', id: user.id }
        setProfile(activeProfile)

        // 2. Load Stats
        const [projRes, invRes, msgRes] = await Promise.all([
          supabase.from('projects').select('id', { count: 'exact' }).eq('client_id', user.id).neq('status', 'delivered'),
          supabase.from('invoices').select('id', { count: 'exact' }).eq('client_id', user.id).eq('status', 'pending'),
          supabase.from('messages').select('id', { count: 'exact' }).eq('is_read', false)
            // Note: complex message policy in DB, just fetching global unread for now
        ])

        setStats({
          projects: projRes.count || 0,
          invoices: invRes.count || 0,
          messages: msgRes.count || 0
        })

        // 3. Load Active Projects with basic milestones
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*, milestones(*)')
          .eq('client_id', user.id)
          .neq('status', 'delivered')
          .order('created_at', { ascending: false })
          .limit(3)

        setActiveProjects(projectsData || [])

        clearTimeout(timeout)
        setLoading(false)
      } catch (err) {
        console.error("Dashboard load error:", err)
        clearTimeout(timeout)
        setLoading(false)
      }
    }

    loadDashboardData()
    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#060606',
        color: 'white', gap: '16px'
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #CC0000',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0F0F0F] to-[#1A0A0A] p-8 rounded-2xl border border-[#cc0000]/20">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.full_name?.split(' ')[0] ?? 'User'} 👋
            </h1>
            <p className="text-white/60">
              Here's an overview of your active projects and service requests.
            </p>
          </div>
          <Link 
            to="/contact"
            className="shrink-0 flex items-center gap-2 bg-[#CC0000] hover:bg-[#CC0000]/80 text-white px-5 py-2.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Submit New Request
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Active Projects" 
            value={stats.projects.toString()} 
            icon={Briefcase} 
            color="red" 
          />
          <StatCard 
            title="Pending Invoices" 
            value={stats.invoices.toString()} 
            icon={FileDigit} 
            color="green" 
          />
          <StatCard 
            title="Unread Messages" 
            value={stats.messages.toString()} 
            icon={MessageSquare} 
            color="blue" 
          />
        </div>

        {/* Active Projects Timeline */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Active Projects</h2>
            <Link to="/dashboard/client/projects" className="text-sm text-[#CC0000] hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {activeProjects.length > 0 ? (
              activeProjects.map(project => {
                const totalMilestones = project.milestones?.length || 0
                const completedMilestones = project.milestones?.filter((m: any) => m.is_completed).length || 0
                const progress = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100)
                
                return (
                  <div key={project.id} className="bg-[#0F0F0F] border border-[#1a6b1a]/30 rounded-xl p-6 hover:border-[#CC0000]/50 transition-colors group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 text-white/70 border border-white/10">
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/50">{project.description}</p>
                      </div>
                      
                      <Link 
                        to="/dashboard/client/projects"
                        className="shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                      >
                        View Details
                      </Link>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-white/60">Milestone Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#1A6B1A] to-[#CC0000] rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-sm text-white/50 flex flex-col items-end">
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-[#1A6B1A]" /> {completedMilestones}/{totalMilestones}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-[#0F0F0F] border border-[#1a6b1a]/20 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/30">
                  <Briefcase size={32} />
                </div>
                <h3 className="text-lg font-medium mb-2">No active projects</h3>
                <p className="text-white/50 max-w-sm mb-6">You don't have any active projects right now. Ready to start something new?</p>
                <Link to="/contact" className="text-[#CC0000] font-medium hover:underline">Submit a service request</Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
