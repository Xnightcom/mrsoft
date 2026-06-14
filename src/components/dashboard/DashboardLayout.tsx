import React, { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Link, useRouter, useLocation, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { 
  LayoutDashboard, Users, FileText, BookOpen, BarChart, Settings,
  GraduationCap, CheckSquare, Calendar, Award, Megaphone, User,
  Briefcase, FileDigit, MessageSquare, LogOut, Bell, Menu, X
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'

interface Props {
  profile?: any
  children: React.ReactNode
}

export function DashboardLayout({ profile: propProfile, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()

  const { data: fetchedProfile } = useQuery({
    queryKey: ['current-profile-layout'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      return data || { role: 'client', full_name: user.email }
    },
    enabled: !propProfile
  })

  const profile = propProfile || fetchedProfile

  React.useEffect(() => {
    if (profile) {
      console.log('Dashboard init - user:', profile?.id)
      console.log('Profile loaded:', profile)
      console.log('is_suspended:', profile?.is_suspended)
      console.log('is_approved:', profile?.is_approved)
      console.log('role:', profile?.role)
    }
  }, [profile]);

  React.useEffect(() => {
    if (profile?.is_suspended) {
      const handleSuspension = async () => {
        navigate({ 
          to: '/auth',
          search: { 
            error: 'suspended',
            reason: profile.suspended_reason ?? 'Your account has been suspended. Contact tambikingdavid@gmail.com'
          } as any
        })
        await supabase.auth.signOut()
      }
      handleSuspension()
    }
  }, [profile, navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }

  const { data: unreadAnnouncementsCount = 0 } = useQuery({
    queryKey: ['unread-announcements', profile?.id],
    queryFn: async () => {
      if (!profile?.role) return 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .contains('target_roles', [profile.role]);
        
      return count ?? 0;
    },
    enabled: !!profile?.role,
    refetchInterval: 60000 // every minute
  });

  // Determine sidebar links based on role
  let links: { to: string; label: string; icon: React.FC<any> }[] = []
  if (profile?.role === 'admin') {
    links = [
      { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
      { to: '/dashboard/admin/users', label: 'Users', icon: Users },
      { to: '/dashboard/admin/requests', label: 'Service Requests', icon: FileText },
      { to: '/dashboard/admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/dashboard/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/dashboard/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/dashboard/admin/messages', label: 'Messages', icon: MessageSquare },
      { to: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart },
      { to: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
    ];
  } else if (profile?.role === 'instructor') {
    links = [
      { to: '/dashboard/instructor', label: 'Overview', icon: LayoutDashboard },
      { to: '/dashboard/instructor/courses', label: 'My Courses', icon: BookOpen },
      { to: '/dashboard/instructor/students', label: 'Students', icon: Users },
      { to: '/dashboard/instructor/attendance', label: 'Attendance', icon: Calendar },
      { to: '/dashboard/instructor/assignments', label: 'Assignments', icon: CheckSquare },
      { to: '/dashboard/instructor/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/dashboard/instructor/messages', label: 'Messages', icon: MessageSquare },
      { to: '/dashboard/instructor/profile', label: 'Profile', icon: User },
    ]
  } else if (profile?.role === 'student') {
    links = [
      { to: '/dashboard/student', label: 'My Learning', icon: LayoutDashboard },
      { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
      { to: '/dashboard/student/assignments', label: 'Assignments', icon: CheckSquare },
      { to: '/dashboard/student/attendance', label: 'Attendance', icon: Calendar },
      { to: '/dashboard/student/certificates', label: 'Certificates', icon: Award },
      { to: '/dashboard/student/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/dashboard/student/messages', label: 'Messages', icon: MessageSquare },
      { to: '/dashboard/student/profile', label: 'Profile', icon: User },
    ]
  } else {
    // Default to client
    links = [
      { to: '/dashboard/client', label: 'Overview', icon: LayoutDashboard },
      { to: '/dashboard/client/projects', label: 'My Projects', icon: Briefcase },
      { to: '/dashboard/client/requests', label: 'Service Requests', icon: FileText },
      { to: '/dashboard/client/invoices', label: 'Invoices', icon: FileDigit },
      { to: '/dashboard/client/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/dashboard/client/messages', label: 'Messages', icon: MessageSquare },
      { to: '/dashboard/client/profile', label: 'Profile', icon: User },
    ]
  }

  const roleColors = {
    admin: { bg: '#CC0000', text: 'white' },
    instructor: { bg: '#B30000', text: 'white' },
    student: { bg: '#1A6B1A', text: 'white' },
    client: { bg: '#1A3A6B', text: 'white' },
  }

  const roleColor = roleColors[(profile?.role as keyof typeof roleColors) || 'client']

  // Get current page title
  const currentLink = links.find(l => location.pathname === l.to || (l.to !== `/dashboard/${profile?.role || 'client'}` && location.pathname.startsWith(l.to)))
  const pageTitle = currentLink ? currentLink.label : 'Dashboard'

  if (profile && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-[#060606] text-white font-sans flex flex-col relative">
        <header className="h-[60px] border-b border-white/10 flex items-center px-6">
          <img src="/mrsoft-logo.png" alt="MRsoft" className="h-8 object-contain mix-blend-screen" />
        </header>
        <div style={{ position: 'relative', flex: 1 }}>
          {/* Normal dashboard behind overlay */}
          <div style={{ 
            filter: 'grayscale(100%) opacity(0.3)',
            pointerEvents: 'none',
            userSelect: 'none',
            height: '100%'
          }}>
            <div className="p-8">
              <div className="h-64 w-full bg-white/5 rounded-xl mb-4"></div>
              <div className="h-32 w-full max-w-md bg-white/5 rounded-xl"></div>
            </div>
          </div>
          
          {/* Approval pending overlay */}
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6,6,6,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: '#0F0F0F',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 16,
              padding: 48,
              maxWidth: 480,
              textAlign: 'center',
            }}>
              <div style={{ 
                fontSize: 64, 
                marginBottom: 24,
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                ⏳
              </div>
              
              <h2 style={{ 
                color: 'white', 
                fontSize: 24, 
                fontWeight: 700,
                marginBottom: 12
              }}>
                Awaiting Admin Approval
              </h2>
              
              <p style={{ 
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.6,
                marginBottom: 24
              }}>
                Your account is being reviewed by our 
                admin team. You'll receive an email 
                notification once approved and will 
                get full access to all features.
              </p>
              
              <div style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                color: 'rgba(245,158,11,0.9)',
                fontSize: 14
              }}>
                📧 Check your email for a confirmation 
                link if you haven't verified yet.
              </div>
              
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '10px 24px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white font-sans">
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar 
        fixed top-0 left-0 h-screen w-[240px] bg-[#0A0A0A] border-r border-[#1a6b1a]/30 z-50
        flex flex-col transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-[60px] flex items-center px-6 border-b border-[#1a6b1a]/20 shrink-0">
          <img 
            src="/mrsoft-logo.png" 
            alt="MRsoft" 
            className="h-8 object-contain mix-blend-screen"
            onError={(e) => {
              // Fallback if logo is missing
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="font-bold text-xl tracking-wider">MRsoft</span>';
            }}
          />
          <button 
            className="ml-auto md:hidden text-white/50 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-6 py-6 border-b border-[#1a6b1a]/20 flex flex-col items-center text-center shrink-0">
          <div className="w-16 h-16 rounded-full bg-white/10 mb-3 overflow-hidden border-2 border-[#1a6b1a]/50">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/50">
                {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <p className="font-semibold text-sm w-full truncate">{profile?.full_name || profile?.email || 'User'}</p>
          <span 
            className="mt-2 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider"
            style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
          >
            {profile?.role || 'CLIENT'}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== `/dashboard/${profile?.role || 'client'}` && location.pathname.startsWith(link.to))
            const Icon = link.icon
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#CC0000]/15 text-white border-l-[3px] border-[#CC0000]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-[#CC0000]' : 'text-white/50'} />
                <span className="flex-1">{link.label}</span>
                {link.label === 'Announcements' && unreadAnnouncementsCount > 0 && (
                  <span className="bg-[#CC0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadAnnouncementsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-[#1a6b1a]/20 shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-col md:ml-[240px] min-h-screen">
        
        {/* Topbar */}
        <header className="h-[60px] fixed top-0 right-0 left-0 md:left-[240px] bg-[#060606]/95 backdrop-blur border-b border-[#1a6b1a]/30 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-white/70 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>

            <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 mt-[60px] p-6 md:p-8">
          <div key={location.pathname} className="animate-page-in">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  )
}
