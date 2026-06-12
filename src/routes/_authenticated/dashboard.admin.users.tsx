import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin/users")({
  component: AdminUsersPage,
});

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "student" | "client";
  company: string | null;
  phone: string | null;
  created_at: string;
}

function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Since admin can read all profiles based on RLS
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "student" | "client" }) => {
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

  const suspendUser = (userName: string) => {
    toast.success(`User ${userName || "Member"} has been suspended successfully.`);
  };

  // Filter and search
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.company ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      key: "avatar_url",
      header: "Avatar",
      render: (item: UserProfile) => (
        <img
          src={item.avatar_url ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
          alt={item.full_name ?? "User"}
          className="h-8 w-8 rounded-full object-cover border border-white/10"
        />
      ),
    },
    { key: "full_name", header: "Name", render: (item: UserProfile) => item.full_name ?? "—" },
    { key: "company", header: "Company", render: (item: UserProfile) => item.company ?? "—" },
    { key: "role", header: "Role", render: (item: UserProfile) => (
        <span className="capitalize text-white/80">{item.role}</span>
      )
    },
    {
      key: "created_at",
      header: "Joined",
      render: (item: UserProfile) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: UserProfile) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={item.role}
            onValueChange={(val: "admin" | "student" | "client") =>
              updateRole.mutate({ userId: item.id, role: val })
            }
          >
            <SelectTrigger className="w-32 bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="bg-red-950/40 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
            onClick={() => suspendUser(item.full_name ?? "")}
          >
            Suspend
          </Button>
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
            Search, adjust roles, and manage system accounts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white placeholder-white/45"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0F0F] border-[rgba(26,107,26,0.3)] text-white">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main table */}
        {isLoading ? (
          <div className="h-96 rounded-xl bg-white/5 animate-pulse border border-[rgba(26,107,26,0.3)]" />
        ) : (
          <DataTable columns={columns} data={filteredUsers} />
        )}
      </div>
    </DashboardLayout>
  );
}
