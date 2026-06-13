import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Modal } from "@/components/dashboard/Modal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, ShieldAlert, UserCheck, Key, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/users")({
  component: AdminUsersPage,
});

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "instructor" | "student" | "client";
  company: string | null;
  phone: string | null;
  created_at: string;
  is_suspended: boolean;
  suspended_reason: string | null;
  is_approved: boolean;
}

function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "instructor" | "student" | "client" }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User role updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const toggleSuspension = useMutation({
    mutationFn: async ({ userId, is_suspended, reason }: { userId: string; is_suspended: boolean; reason?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended,
          suspended_reason: is_suspended ? reason : null,
          suspended_at: is_suspended ? new Date().toISOString() : null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.is_suspended ? "suspended" : "unsuspended"} successfully.`);
      setSuspendModalOpen(false);
      setSelectedUser(null);
      setSuspendReason("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const approveUser = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentAdminId = sessionData?.session?.user?.id;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: currentAdminId
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Account Approved! 🎉',
          body: 'Your MRsoft account has been approved. You now have full access to the platform.',
          type: 'approval',
          is_read: false
        });
      if (notifError) throw notifError;

      // Send the email via Edge Function (non-blocking)
      supabase.functions.invoke('send-approval-email', {
        body: { userId }
      }).then(({ error }) => {
        if (error) {
          console.error("Failed to trigger approval email function:", error);
        }
      });
    },
    onSuccess: () => {
      toast.success("User approved successfully!");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const handleSuspendClick = (user: UserProfile) => {
    setSelectedUser(user);
    setSuspendModalOpen(true);
  };

  const handleUnsuspendClick = (user: UserProfile) => {
    if (confirm(`Are you sure you want to unsuspend ${user.full_name}?`)) {
      toggleSuspension.mutate({ userId: user.id, is_suspended: false });
    }
  };

  const getFilteredUsers = (role: string) => {
    return users.filter((u) => {
      const matchesSearch =
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.company ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === "all" || u.role === role;
      return matchesSearch && matchesRole;
    });
  };

  const columns = [
    {
      key: "avatar_url",
      header: "Avatar",
      render: (item: UserProfile) => (
        <div className="relative">
          <img
            src={item.avatar_url ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
            alt={item.full_name ?? "User"}
            className={`h-8 w-8 rounded-full object-cover border border-white/10 ${item.is_suspended ? "grayscale" : ""}`}
          />
          {item.is_suspended && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border border-[#060606] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">!</span>
            </div>
          )}
        </div>
      ),
    },
    { 
      key: "full_name", 
      header: "Name", 
      render: (item: UserProfile) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{item.full_name ?? "—"}</span>
          <span className="text-[10px] text-white/40">{item.company ?? "No company"}</span>
        </div>
      ) 
    },
    { 
      key: "status", 
      header: "Status", 
      render: (item: UserProfile) => (
        item.is_suspended 
          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">Suspended</span>
          : !item.is_approved
          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending Approval</span>
          : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-500 border border-green-500/20">Active</span>
      )
    },
    { 
      key: "role", 
      header: "Role", 
      render: (item: UserProfile) => (
        <span className="capitalize text-white/80 text-xs">{item.role}</span>
      )
    },
    {
      key: "created_at",
      header: "Joined",
      render: (item: UserProfile) => <span className="text-xs text-white/60">{new Date(item.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: UserProfile) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={item.role}
            onValueChange={(val: "admin" | "instructor" | "student" | "client") =>
              updateRole.mutate({ userId: item.id, role: val })
            }
          >
            <SelectTrigger className="w-28 h-8 text-xs bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>

          {!item.is_approved && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white"
              onClick={() => approveUser.mutate({ userId: item.id })}
              disabled={approveUser.isPending}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
          )}

          {item.is_suspended ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white"
              onClick={() => handleUnsuspendClick(item)}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Unsuspend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => handleSuspendClick(item)}
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-white/50 text-sm mt-1">
            Search, adjust roles, and manage system access.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white placeholder-white/45"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#1A6B1A] data-[state=active]:text-white">All Users</TabsTrigger>
            <TabsTrigger value="instructor" className="data-[state=active]:bg-[#1A6B1A] data-[state=active]:text-white">Instructors</TabsTrigger>
            <TabsTrigger value="student" className="data-[state=active]:bg-[#1A6B1A] data-[state=active]:text-white">Students</TabsTrigger>
            <TabsTrigger value="client" className="data-[state=active]:bg-[#1A6B1A] data-[state=active]:text-white">Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="h-96 rounded-xl bg-white/5 animate-pulse border border-[rgba(26,107,26,0.3)]" />
            ) : (
              <DataTable columns={columns} data={getFilteredUsers("all")} />
            )}
          </TabsContent>
          <TabsContent value="instructor" className="mt-4">
            <DataTable columns={columns} data={getFilteredUsers("instructor")} />
          </TabsContent>
          <TabsContent value="student" className="mt-4">
            <DataTable columns={columns} data={getFilteredUsers("student")} />
          </TabsContent>
          <TabsContent value="client" className="mt-4">
            <DataTable columns={columns} data={getFilteredUsers("client")} />
          </TabsContent>
        </Tabs>
      </div>

      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend User"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedUser) {
              toggleSuspension.mutate({ userId: selectedUser.id, is_suspended: true, reason: suspendReason });
            }
          }}
          className="space-y-4"
        >
          <p className="text-sm text-white/70">
            You are about to suspend <strong>{selectedUser?.full_name}</strong>. They will no longer be able to log in.
          </p>
          <div className="space-y-1">
            <Label className="text-white/70">Reason for suspension</Label>
            <Textarea
              required
              placeholder="Provide a reason..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="bg-[#060606] border-[rgba(26,107,26,0.3)] text-white min-h-[100px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-[rgba(26,107,26,0.3)] text-white/70 hover:bg-white/5"
              onClick={() => setSuspendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={toggleSuspension.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {toggleSuspension.isPending ? "Suspending..." : "Confirm Suspend"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
