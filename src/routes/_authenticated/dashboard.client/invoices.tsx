import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, CreditCard, DollarSign, Wallet, FileCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/client/invoices")({
  component: ClientInvoicesPage,
});

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "overdue";
  due_date: string | null;
  pdf_url: string | null;
  project: {
    title: string;
  } | null;
}

function ClientInvoicesPage() {
  const { profile } = useProfile();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["client-invoices-list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          amount,
          currency,
          status,
          due_date,
          pdf_url,
          project_id
        `)
        .eq("client_id", profile.id);

      if (error) throw error;

      const projectIds = data.map(a => a.project_id).filter(Boolean);
      let projectsMap: Record<string, string> = {};
      if (projectIds.length > 0) {
        const { data: projectData } = await supabase
          .from("projects")
          .select("id, title")
          .in("id", projectIds);
        if (projectData) {
          projectData.forEach(p => {
            projectsMap[p.id] = p.title;
          });
        }
      }

      return data.map(a => ({
        ...a,
        project: a.project_id ? { title: projectsMap[a.project_id] || "Project" } : null
      })) as unknown as Invoice[];
    },
    enabled: !!profile?.id,
  });

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  const outstandingBalance = totalBilled - totalPaid;

  const handlePay = (inv: Invoice) => {
    toast.info("Redirecting to secured Payment Gateway...");
    setTimeout(() => {
      window.open("https://checkout.flutterwave.com/pay/mrsoft-nexus-mock", "_blank");
    }, 800);
  };

  const handleDownloadPdf = (pdfUrl: string | null, id: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    } else {
      toast.error("Invoice PDF is generating. Please check back shortly.");
    }
  };

  const formatCurrency = (val: number, curr = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 0,
    }).format(val);
  };

  const columns = [
    {
      key: "id",
      header: "Invoice #",
      render: (item: Invoice) => (
        <span className="font-mono text-xs text-white/50">#{item.id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: "project",
      header: "Project Title",
      render: (item: Invoice) => item.project?.title ?? "General Engagement",
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: Invoice) => (
        <strong className="text-white">{formatCurrency(item.amount, item.currency)}</strong>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (item: Invoice) => (item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Invoice) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Invoice) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="border-[rgba(26,107,26,0.3)] text-white hover:bg-white/5 flex items-center gap-1 text-[11px]"
            onClick={() => handleDownloadPdf(item.pdf_url, item.id)}
          >
            <Download className="h-3 w-3" />
            PDF
          </Button>

          {item.status !== "paid" && (
            <Button
              size="sm"
              className="bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white flex items-center gap-1 text-[11px] font-bold"
              onClick={() => handlePay(item)}
            >
              <CreditCard className="h-3 w-3" />
              Pay Now
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
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-white/50 text-sm mt-1">
            Review your invoice transactions, outstanding balances, and fulfill payments online.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium uppercase">Total Billed</p>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(totalBilled, invoices[0]?.currency)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium uppercase">Total Paid</p>
                  <h3 className="text-2xl font-bold text-[#22c55e] mt-1">
                    {formatCurrency(totalPaid, invoices[0]?.currency)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#1A6B1A]/10 text-[#22c55e] border border-[#1A6B1A]/20 flex items-center justify-center">
                  <FileCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] border-[#CC0000]/30">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 font-medium uppercase">Outstanding Balance</p>
                  <h3 className="text-2xl font-bold text-[#ef4444] mt-1">
                    {formatCurrency(outstandingBalance, invoices[0]?.currency)}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#CC0000]/10 text-[#ef4444] border border-[#CC0000]/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 rounded-xl bg-white/5 border border-[rgba(26,107,26,0.3)] animate-pulse" />
        ) : (
          <DataTable columns={columns} data={invoices} />
        )}
      </div>
    </DashboardLayout>
  );
}
