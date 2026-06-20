import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Percent, TrendingUp, BarChart2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/analytics")({
  component: AdminAnalyticsPage,
});

const COLORS = ["#CC0000", "#1A6B1A", "#1A3A6B", "#FFB300"];

function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics-data"],
    queryFn: async () => {
      // 1. Fetch profiles for user distribution & signups by month
      const { data: profiles = [], error: pErr } = await supabase
        .from("profiles")
        .select("role, created_at");
      if (pErr) throw pErr;

      // 2. Fetch service requests for request categories
      const { data: requests = [], error: rErr } = await supabase
        .from("service_requests")
        .select("service");
      if (rErr) throw rErr;

      // 3. Fetch enrollments for completion rate
      const { data: enrollments = [], error: eErr } = await supabase
        .from("enrollments")
        .select("progress");
      if (eErr) throw eErr;

      // ----------------------------------------
      // AGGREGATION 1: User Roles Distribution
      // ----------------------------------------
      const roleCounts = profiles.reduce(
        (acc: Record<string, number>, curr: any) => {
          const r = curr.role ?? "client";
          acc[r] = (acc[r] || 0) + 1;
          return acc;
        },
        { admin: 0, student: 0, client: 0 },
      );
      const roleData = Object.keys(roleCounts).map((role) => ({
        name: role.toUpperCase(),
        value: roleCounts[role],
      }));

      // ----------------------------------------
      // AGGREGATION 2: Signups per Month (Last 6 Months)
      // ----------------------------------------
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlyCounts: Record<string, number> = {};

      // Initialize last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthlyCounts[key] = 0;
      }

      profiles.forEach((p: any) => {
        const d = new Date(p.created_at);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (key in monthlyCounts) {
          monthlyCounts[key]++;
        }
      });

      const signupData = Object.keys(monthlyCounts).map((key) => ({
        month: key,
        Signups: monthlyCounts[key],
      }));

      // ----------------------------------------
      // AGGREGATION 3: Service Requests by Type
      // ----------------------------------------
      const serviceCounts = requests.reduce((acc: Record<string, number>, curr: any) => {
        const s = curr.service || "Other";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      const serviceData = Object.keys(serviceCounts).map((s) => ({
        service: s,
        Requests: serviceCounts[s],
      }));

      // ----------------------------------------
      // AGGREGATION 4: Course Completion Rate
      // ----------------------------------------
      const totalEnrolled = enrollments.length;
      const completed = enrollments.filter((e: any) => (e.progress ?? 0) >= 100).length;
      const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;

      return {
        roleData,
        signupData,
        serviceData,
        completionRate,
        totalEnrolled,
      };
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
          <p className="text-white/50 text-sm mt-1">
            Visual statistics, platform engagement, and growth insights.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 bg-white/5 border border-[rgba(26,107,26,0.2)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Top Statistics card */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 font-medium">Avg Completion Rate</p>
                    <h3 className="text-3xl font-bold text-white mt-1">
                      {analytics?.completionRate}%
                    </h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-[#1A6B1A]/10 text-[#22c55e] border border-[#1A6B1A]/20 flex items-center justify-center">
                    <Percent className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50 font-medium">Total Course Enrolls</p>
                    <h3 className="text-3xl font-bold text-white mt-1">
                      {analytics?.totalEnrolled}
                    </h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-[#CC0000]/10 text-[#CC0000] border border-[#CC0000]/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Signups Over Time */}
              <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-wider text-white uppercase">
                    User Signups (Last 6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.signupData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="month" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F0F0F",
                          borderColor: "rgba(26,107,26,0.3)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Signups"
                        stroke="#CC0000"
                        strokeWidth={2.5}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Requests by Type */}
              <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-wider text-white uppercase">
                    Service Requests By Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.serviceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="service" stroke="#888" fontSize={10} />
                      <YAxis stroke="#888" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F0F0F",
                          borderColor: "rgba(26,107,26,0.3)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Requests" fill="#1A6B1A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Roles Density */}
              <Card className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)]">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-wider text-white uppercase">
                    User Roles Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="w-full h-full relative flex flex-col items-center">
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={analytics?.roleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics?.roleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F0F0F",
                            borderColor: "rgba(26,107,26,0.3)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Custom Legend */}
                    <div className="flex gap-4 text-xs font-semibold mt-1">
                      {analytics?.roleData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-white/60">{entry.name}:</span>
                          <span className="text-white">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
