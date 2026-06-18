import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Modal } from '@/components/dashboard/Modal'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/dashboard/admin/announcements')({
  component: AdminAnnouncements,
})

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    target_roles: ['admin','instructor',
      'student','client'],
    is_pinned: false,
    expires_at: ''
  })
  const [saving, setSaving] = useState(false)

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select(`
        *,
        profiles!created_by (full_name)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  async function createAnnouncement() {
    if (!form.title || !form.body) return
    setSaving(true)
    
    const { data: { session } } = 
      await supabase.auth.getSession()
    
    const { data: announcement, error } = 
      await supabase
        .from('announcements')
        .insert({
          title: form.title,
          body: form.body,
          target_roles: form.target_roles,
          is_pinned: form.is_pinned,
          expires_at: form.expires_at || null,
          created_by: session?.user.id
        })
        .select()
        .single()
    
    if (error) {
      showToast(error.message, 'error')
      setSaving(false)
      return
    }
    
    // Notify all target users
    const { data: targets } = await supabase
      .from('profiles')
      .select('id')
      .in('role', form.target_roles)
    
    if (targets?.length > 0) {
      await supabase.from('notifications').insert(
        targets.map((t: any) => ({
          user_id: t.id,
          title: `📢 ${form.title}`,
          body: form.body.slice(0, 100),
          type: 'info',
          action_url: '/dashboard/announcements'
        }))
      )
    }
    
    setSaving(false)
    setShowModal(false)
    setForm({
      title: '', body: '',
      target_roles: ['admin','instructor',
        'student','client'],
      is_pinned: false,
      expires_at: ''
    })
    fetchAnnouncements()
    showToast('Announcement posted!', 'success')
  }

  async function deleteAnnouncement(id: any) {
    await supabase
      .from('announcements')
      .delete()
      .eq('id', id)
    setAnnouncements(prev => 
      prev.filter((a: any) => a.id !== id)
    )
    showToast('Announcement deleted', 'success')
  }

  async function togglePin(id: any, currentPin: any) {
    await supabase
      .from('announcements')
      .update({ is_pinned: !currentPin })
      .eq('id', id)
    fetchAnnouncements()
  }

  const roleColors: Record<string, string> = {
    admin: '#CC0000',
    instructor: '#1A6B1A', 
    student: '#3B82F6',
    client: '#8B5CF6'
  }

  const handleRoleToggle = (role: string) => {
    setForm(prev => {
      const isSelected = prev.target_roles.includes(role);
      const nextRoles = isSelected
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role];
      return { ...prev, target_roles: nextRoles };
    });
  }

  return (
    <DashboardLayout>
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              fontSize: 24, 
              fontWeight: 700 
            }}>
              Announcements
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              marginTop: 4
            }}>
              Post announcements to users by role
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#CC0000',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            + New Announcement
          </button>
        </div>

        {/* Announcements list */}
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.5)' }}>
            Loading...
          </div>
        ) : announcements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255,255,255,0.3)'
          }}>
            <p style={{ fontSize: 48 }}>📢</p>
            <p style={{ fontSize: 18, marginTop: 12 }}>
              No announcements yet
            </p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Click "New Announcement" to post one
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12 
          }}>
            {announcements.map(a => (
              <div key={a.id} style={{
                background: '#0F0F0F',
                border: a.is_pinned 
                  ? '1px solid rgba(245,158,11,0.4)'
                  : '1px solid rgba(26,107,26,0.2)',
                borderRadius: 12,
                padding: 20,
                position: 'relative',
                animation: 'cardIn 0.3s ease forwards'
              }}>
                {/* Pin badge */}
                {a.is_pinned && (
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 12,
                    background: 'rgba(245,158,11,0.15)',
                    color: '#F59E0B',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid rgba(245,158,11,0.3)'
                  }}>
                    📌 Pinned
                  </span>
                )}
                
                {/* Title */}
                <h3 style={{ 
                  color: 'white', 
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 8,
                  paddingRight: a.is_pinned ? 80 : 0
                }}>
                  {a.title}
                </h3>
                
                {/* Body */}
                <p style={{ 
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 12
                }}>
                  {a.body}
                </p>
                
                {/* Target role chips */}
                <div style={{ 
                  display: 'flex', 
                  gap: 6, 
                  flexWrap: 'wrap',
                  marginBottom: 12 
                }}>
                  {a.target_roles?.map((role: string) => (
                    <span key={role} style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${roleColors[role]}20`,
                      color: roleColors[role],
                      border: `1px solid ${roleColors[role]}40`,
                      textTransform: 'capitalize'
                    }}>
                      {role}
                    </span>
                  ))}
                </div>
                
                {/* Meta + Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 12
                  }}>
                    By {a.profiles?.full_name ?? 'Admin'} • 
                    {new Date(a.created_at)
                      .toLocaleDateString()}
                    {a.expires_at && ` • Expires ${
                      new Date(a.expires_at)
                        .toLocaleDateString()
                    }`}
                  </span>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => togglePin(
                        a.id, a.is_pinned
                      )}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#F59E0B',
                        padding: '4px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      {a.is_pinned ? 'Unpin' : '📌 Pin'}
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(204,0,0,0.3)',
                        color: '#F87171',
                        padding: '4px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Announcement"
          maxWidth={500}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Title</label>
                <input
                  type="text"
                  placeholder="Announcement Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{
                    background: '#060606',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Content</label>
                <textarea
                  placeholder="Write details..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  style={{
                    background: '#060606',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'white',
                    fontSize: 14,
                    minHeight: 100,
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Target Roles</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {['admin', 'instructor', 'student', 'client'].map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontSize: 13, textTransform: 'capitalize', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.target_roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        style={{ accentColor: '#CC0000' }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="modal-pin-toggle"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  style={{ accentColor: '#CC0000' }}
                />
                <label htmlFor="modal-pin-toggle" style={{ color: 'white', fontSize: 13, cursor: 'pointer' }}>Pin to top</label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  style={{
                    background: '#060606',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: 8,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createAnnouncement}
                  disabled={saving || !form.title || !form.body || form.target_roles.length === 0}
                  style={{
                    background: '#CC0000',
                    border: 'none',
                    color: 'white',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13,
                    opacity: (saving || !form.title || !form.body || form.target_roles.length === 0) ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Post Announcement'}
                </button>
              </div>
            </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
