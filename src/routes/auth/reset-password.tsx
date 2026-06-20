import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setDone(true);
      setTimeout(() => navigate({ to: "/auth" }), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <SiteHeader />
      <div className="flex-1 grid place-items-center px-4 py-12">
        <Card className="w-full max-w-md auth-glass-card" style={{ padding: 40, borderRadius: 16 }}>
          <CardContent className="p-0">
            {done ? (
              <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Password Updated!</h2>
                <p className="text-white/80 mb-6 text-sm">
                  Your new password has been set. Redirecting to sign in...
                </p>
                <Button
                  onClick={() => navigate({ to: "/auth" })}
                  className="w-full bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white"
                >
                  Go to Sign in
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-8">
                  <h1 className="text-2xl font-bold text-white">Set new password</h1>
                  <p className="text-sm text-white/60 mt-2 text-center">
                    Please enter your new password below.
                  </p>
                </div>

                {error && (
                  <div className="bg-[#CC0000]/10 border border-[#CC0000]/30 rounded-lg p-3 text-center mb-6 text-[#CC0000] text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <Label className="text-white/80">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className="auth-input pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showPassword ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        className="auth-input pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#CC0000] hover:bg-[#CC0000]/80 text-white mt-6"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>

                <p className="mt-8 text-center text-xs text-white/40">
                  <Link
                    to="/auth"
                    className="hover:underline hover:text-white/70 transition-smooth"
                  >
                    ← Back to sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
