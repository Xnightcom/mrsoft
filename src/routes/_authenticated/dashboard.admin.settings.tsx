import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-3xl">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Workspace and platform configuration.</p>
        <Card className="mt-8"><CardContent className="p-8">
          <h3 className="font-semibold">Roles & permissions</h3>
          <p className="text-sm text-muted-foreground mt-2">Roles (admin / instructor / client / student) are assigned at signup and managed via the database.</p>
          <h3 className="font-semibold mt-6">Security</h3>
          <p className="text-sm text-muted-foreground mt-2">All tables are protected by row-level security. Admins bypass restrictions through role checks.</p>
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
