import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Modal } from "@/components/dashboard/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { Pin, Trash2, Edit2, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/announcements")({
  component: AdminAnnouncementsPage,
});

const ALL_ROLES = ["admin", "instructor", "student", "client"];

function AdminAnnouncementsPage() {
  const qc = useQueryClient();
  const { profile } = useProfile();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    targetRoles: [...ALL_ROLES],
    isPinned: false,
    hasExpiry: false,
    expiresAt: "",
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          created_by_profile:profiles!announcements_created_by_fkey(full_name)
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      const payload = {
        title: form.title,
        body: form.body,
        target_roles: form.targetRoles,
        is_pinned: form.isPinned,
        expires_at: form.hasExpiry && form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("announcements")
          .insert({ ...payload, created_by: profile.id })
          .select()
          .maybeSingle();
        if (error) throw error;

        // Also insert notifications
        if (data) {
          const { data: targets } = await supabase
            .from("profiles")
            .select("id")
            .in("role", form.targetRoles);
          
          if (targets && targets.length > 0) {
            await supabase.from("notifications").insert(
              targets.map(t => ({
                user_id: t.id,
                title: `📢 ${form.title}`,
                body: form.body.slice(0, 100) + (form.body.length > 100 ? "..." : ""),
                type: "info",
                action_url: `/dashboard/${profile.role}/announcements`
              }))
            );
          }
        }
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Announcement updated" : "Announcement created");
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save announcement");
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from("announcements")
        .update({ is_pinned: isPinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  const openNewModal = () => {
    setEditingId(null);
    setForm({
      title: "",
      body: "",
      targetRoles: [...ALL_ROLES],
      isPinned: false,
      hasExpiry: false,
      expiresAt: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (announcement: any) => {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      body: announcement.body,
      targetRoles: announcement.target_roles || [],
      isPinned: announcement.is_pinned || false,
      hasExpiry: !!announcement.expires_at,
      expiresAt: announcement.expires_at ? new Date(announcement.expires_at).toISOString().split('T')[0] : "",
    });
    setModalOpen(true);
  };

  const toggleRole = (role: string) => {
    setForm(prev => {
      const isSelected = prev.targetRoles.includes(role);
      const newRoles = isSelected 
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role];
      return { ...prev, targetRoles: newRoles };
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-white/50 text-sm mt-1">Manage global platform announcements.</p>
          </div>
          <Button onClick={openNewModal} className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white">
            New Announcement
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse border border-[rgba(26,107,26,0.3)]" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
            <h3 className="text-lg font-bold text-white mb-2">No announcements</h3>
            <p className="text-white/50">Create an announcement to communicate with users.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann: any, index: number) => (
              <div 
                key={ann.id} 
                className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-6 transition-all animate-card-in opacity-0 relative"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {ann.is_pinned && (
                  <div className="absolute top-4 right-4 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                    <Pin size={12} /> PINNED
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2 pr-20">{ann.title}</h3>
                <p className="text-white/70 text-sm mb-4 whitespace-pre-wrap">{ann.body}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white/70">Targets:</span>
                    {ann.target_roles.map((r: string) => (
                      <span key={r} className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{r}</span>
                    ))}
                  </div>
                  <div>
                    <span className="font-semibold text-white/70">Posted by:</span> {ann.created_by_profile?.full_name || 'Admin'}
                  </div>
                  {ann.expires_at && (
                    <div className="flex items-center gap-1 text-yellow-500/70">
                      <Calendar size={14} /> Expires: {new Date(ann.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/20 text-white hover:bg-white/10 h-8 text-xs"
                    onClick={() => togglePinMutation.mutate({ id: ann.id, isPinned: !ann.is_pinned })}
                  >
                    <Pin size={14} className="mr-1" /> {ann.is_pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/20 text-white hover:bg-white/10 h-8 text-xs"
                    onClick={() => openEditModal(ann)}
                  >
                    <Edit2 size={14} className="mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#CC0000]/30 text-[#CC0000] hover:bg-[#CC0000]/10 h-8 text-xs"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this announcement?")) {
                        deleteMutation.mutate(ann.id);
                      }
                    }}
                  >
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Announcement" : "New Announcement"}
      >
        <form 
          className="space-y-4 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.targetRoles.length === 0) {
              return toast.error("Select at least one target role");
            }
            saveMutation.mutate();
          }}
        >
          <div>
            <Label className="text-white/70 text-xs">Title *</Label>
            <Input 
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-[#060606] border-white/20 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-white/70 text-xs">Body *</Label>
            <Textarea 
              required
              minLength={10}
              rows={4}
              value={form.body}
              onChange={e => setForm({...form, body: e.target.value})}
              className="bg-[#060606] border-white/20 text-white mt-1"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-white/70 text-xs">Target Audience *</Label>
              <button 
                type="button"
                className="text-[10px] text-[#CC0000] hover:underline font-bold"
                onClick={() => setForm(p => ({ ...p, targetRoles: p.targetRoles.length === ALL_ROLES.length ? [] : [...ALL_ROLES] }))}
              >
                {form.targetRoles.length === ALL_ROLES.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex gap-4">
              {ALL_ROLES.map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={form.targetRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                    className="border-white/20 data-[state=checked]:bg-[#CC0000] data-[state=checked]:border-[#CC0000]"
                  />
                  <span className="text-sm text-white capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox 
              id="pin-toggle"
              checked={form.isPinned}
              onCheckedChange={(c) => setForm({...form, isPinned: c as boolean})}
              className="border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
            />
            <Label htmlFor="pin-toggle" className="text-white text-sm cursor-pointer">Pin to top (shows first always)</Label>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                id="expiry-toggle"
                checked={!form.hasExpiry}
                onCheckedChange={(c) => {
                  const noExpiry = c as boolean;
                  setForm({...form, hasExpiry: !noExpiry, expiresAt: noExpiry ? "" : form.expiresAt });
                }}
                className="border-white/20 data-[state=checked]:bg-[#1A6B1A] data-[state=checked]:border-[#1A6B1A]"
              />
              <Label htmlFor="expiry-toggle" className="text-white text-sm cursor-pointer">No expiry (permanent)</Label>
            </div>
            
            {form.hasExpiry && (
              <div className="pl-6">
                <Label className="text-white/70 text-xs">Expiry Date</Label>
                <Input 
                  type="date"
                  required={form.hasExpiry}
                  min={new Date().toISOString().split('T')[0]}
                  value={form.expiresAt}
                  onChange={e => setForm({...form, expiresAt: e.target.value})}
                  className="bg-[#060606] border-white/20 text-white mt-1 w-48"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" className="border-white/20 text-white" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="bg-[#CC0000] hover:bg-[#CC0000]/80 text-white">
              {saveMutation.isPending ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
