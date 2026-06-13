import React, { useState } from 'react'
import { Link, useRouter, useLocation, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { 
  LayoutDashboard, Users, FileText, BookOpen, BarChart, Settings,
  GraduationCap, CheckSquare, Calendar, Award, Megaphone, User,
  Briefcase, FileDigit, MessageSquare, LogOut, Bell, Menu, X
} from 'lucide-react'

interface Props {
  profile?: any
  children: React.ReactNode
}

export function DashboardLayout({ profile: propProfile, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const { data: fetchedProfile } = useQuery({
    queryKey: ['current-profile-layout'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data || { role: 'client', full_name: user.email }
    },
    enabled: !propProfile
  })

  const profile = propProfile || fetchedProfile

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }

  // Determine sidebar links based on role
  let links: { to: string; label: string; icon: React.FC<any> }[] = []
  if (profile?.role === 'admin') {
    links = [
      { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
      { to: '/dashboard/admin/users', label: 'Users', icon: Users },
      { to: '/dashboard/admin/requests', label: 'Service Requests', icon: FileText },
      { to: '/dashboard/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/dashboard/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart },
      { to: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
    ]
  } else if (profile?.role === 'student') {
    links = [
      { to: '/dashboard/student', label: 'My Learning', icon: LayoutDashboard },
      { to: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
      { to: '/dashboard/student/assignments', label: 'Assignments', icon: CheckSquare },
      { to: '/dashboard/student/attendance', label: 'Attendance', icon: Calendar },
      { to: '/dashboard/student/certificates', label: 'Certificates', icon: Award },
      { to: '/dashboard/student/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/dashboard/student/profile', label: 'Profile', icon: User },
    ]
  } else {
    // Default to client
    links = [
      { to: '/dashboard/client', label: 'Overview', icon: LayoutDashboard },
      { to: '/dashboard/client/projects', label: 'My Projects', icon: Briefcase },
      { to: '/dashboard/client/requests', label: 'Service Requests', icon: FileText },
      { to: '/dashboard/client/invoices', label: 'Invoices', icon: FileDigit },
      { to: '/dashboard/client/messages', label: 'Messages', icon: MessageSquare },
      { to: '/dashboard/client/profile', label: 'Profile', icon: User },
    ]
  }

  const roleColors = {
    admin: { bg: '#CC0000', text: 'white' },
    student: { bg: '#1A6B1A', text: 'white' },
    client: { bg: '#1A3A6B', text: 'white' },
  }

  const roleColor = roleColors[(profile?.role as keyof typeof roleColors) || 'client']

  // Get current page title
  const currentLink = links.find(l => location.pathname === l.to || (l.to !== '/dashboard/client' && location.pathname.startsWith(l.to)))
  const pageTitle = currentLink ? currentLink.label : 'Dashboard'

  return (
    <div className="flex min-h-screen bg-[#060606] text-white font-sans">
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
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
                {link.label}
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
      <div className="flex-1 flex flex-col md:ml-[240px] min-h-screen">
        
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
            {/* Notification Bell */}
            <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <Bell size={20} />
              {/* Badge placeholder */}
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#CC0000] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-[60px] p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
        
      </div>
    </div>
  )
}
