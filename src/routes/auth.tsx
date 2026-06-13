import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGooglePopup } from "@/integrations/firebase/client";
import { toast } from "sonner";
import { Cpu } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — MRsoft" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Strip any trailing slash so we never produce double-slash URIs
  const publicBase = (
    (import.meta.env.VITE_PUBLIC_URL as string | undefined)?.replace(/\/$/, "")
    ?? window.location.origin
  );
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ email: "", password: "", confirm_password: "", full_name: "", role: "student" });
  
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);
  
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(signIn);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (signUp.password !== signUp.confirm_password) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUp.email,
      password: signUp.password,
      options: {
        emailRedirectTo: `${publicBase}/dashboard`,
        data: { full_name: signUp.full_name, role: signUp.role },
      },
    });
    
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    // Notify admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
      
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: 'New User Signup',
        body: `${signUp.full_name} (${signUp.role}) has signed up and is awaiting approval.`,
        type: 'new_user',
        action_url: '/dashboard/admin/users',
        is_read: false
      }));
      await supabase.from('notifications').insert(notifications);
    }
    
    setLoading(false);
    setPendingApproval(true);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const hasFirebaseConfig = Boolean(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID &&
        import.meta.env.VITE_FIREBASE_APP_ID,
      );

      if (hasFirebaseConfig) {
        const result = await signInWithGooglePopup();
        setLoading(false);
        if (!result || !result.user) return toast.error('Google sign-in failed');
        navigate({ to: "/dashboard" });
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${publicBase}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      } as any);
      setLoading(false);
      if (error) return toast.error(error.message || 'Google sign-in failed');
      if ((data as any)?.url) {
        window.location.assign((data as any).url);
        return;
      }
      navigate({ to: "/dashboard" });
    } catch (e) {
      setLoading(false);
      return toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <SiteHeader />
      <div className="flex-1 grid place-items-center px-4 py-12">
        <Card className="w-full max-w-md auth-glass-card" style={{ padding: 40, borderRadius: 16 }}>
          <CardContent className="p-0">
            <div className="flex flex-col items-center mb-6">
              <img
                src="/mrsoft-logo-new.png"
                alt="MRsoft Logo"
                className="object-contain mb-4 animate-float logo-blend"
                style={{
                  height: 80,
                  width: "auto",
                  mixBlendMode: "screen",
                  background: "transparent",
                  filter: "contrast(1.1) brightness(1.05)",
                  border: "none",
                  boxShadow: "none"
                }}
              />
              <h1 className="text-2xl font-bold text-white">Welcome to MRsoft</h1>
              <p className="text-sm text-white/60 mt-1">Sign in to access your portal</p>
            </div>

            {(() => {
              const searchParams = new URLSearchParams(window.location.search);
              const error = searchParams.get("error");
              const reason = searchParams.get("reason");

              if (error === "suspended") {
                return (
                  <div className="bg-[#CC0000]/10 border border-[#CC0000]/30 rounded-xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#CC0000]/20 flex items-center justify-center mx-auto text-[#CC0000]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-red-500">Your account has been suspended</h2>
                      <p className="text-sm text-red-400 mt-1">Reason: {reason || "Violation of terms"}</p>
                    </div>
                    <p className="text-xs text-white/50">
                      Please contact support at <a href="mailto:tambikingdavid@gmail.com" className="text-white underline">tambikingdavid@gmail.com</a>
                    </p>
                  </div>
                );
              }

              if (pendingApproval) {
                return (
                  <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                    <div className="text-6xl mb-6 animate-pulse flex justify-center">⏳</div>
                    <h2 className="text-2xl font-bold text-white mb-3">Account Created Successfully!</h2>
                    <p className="text-white/80 mb-6 text-sm">Hi {signUp.full_name}! Your account is pending admin approval.</p>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-amber-500 text-xs text-left leading-relaxed">
                      📧 We've sent a confirmation email to {signUp.email}. Please check your inbox and click the link to verify your email address.
                      <br/><br/>
                      Once verified and approved by our admin team, you'll have full access to the platform.
                    </div>
                    <Button onClick={() => navigate({ to: '/dashboard' })} className="btn-primary-gradient w-full">Go to Dashboard</Button>
                  </div>
                );
              }

              return (
                <>
                  <Button
                    onClick={handleGoogle}
                    variant="outline"
                    className="w-full mb-4 text-white google-btn-glow"
                    disabled={loading}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .5 4.1 1.5l3-3C17.2 1.8 14.8.8 12 .8 7.3.8 3.3 3.5 1.4 7.5l3.5 2.7C5.8 7.2 8.7 5 12 5z"/><path fill="#34A853" d="M23 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6.2c-.3 1.4-1.1 2.6-2.3 3.4l3.5 2.7c2.1-1.9 3.6-4.8 3.6-8.2z"/><path fill="#4A90E2" d="M5 14.2c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L1.4 7.5C.5 9 0 10.4 0 12s.5 3 1.4 4.5L5 14.2z"/><path fill="#FBBC05" d="M12 23.2c3 0 5.5-1 7.4-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.9 1.1-3.3 0-6.2-2.2-7.1-5.3L1.4 16.5C3.3 20.5 7.3 23.2 12 23.2z"/></svg>
                    Continue with Google
                  </Button>

                  <div className="relative my-4 text-center text-xs text-white/40">
                    <span className="px-2 relative z-10" style={{ background: "rgba(8,8,8,0.88)" }}>or with email</span>
                    <span className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                  </div>

                  <Tabs defaultValue="signin">
                    <TabsList className="grid grid-cols-2 w-full bg-white/5 p-1 rounded-lg border border-white/5">
                      <TabsTrigger
                        value="signin"
                        className="cursor-pointer text-white/50 data-[state=active]:text-white data-[state=active]:border-[#CC0000] border-b-2 border-transparent rounded-none bg-transparent transition-all duration-300 py-2 font-medium"
                      >
                        Sign in
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="cursor-pointer text-white/50 data-[state=active]:text-white data-[state=active]:border-[#1A6B1A] border-b-2 border-transparent rounded-none bg-transparent transition-all duration-300 py-2 font-medium"
                      >
                        Sign up
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="signin">
                      <form onSubmit={handleSignIn} className="space-y-3 mt-3">
                        <div><Label className="text-white/80">Email</Label><Input type="email" required className="auth-input" value={signIn.email} onChange={(e) => setSignIn({ ...signIn, email: e.target.value })} /></div>
                        <div>
                          <Label className="text-white/80">Password</Label>
                          <div className="relative">
                            <Input type={showSignInPassword ? 'text' : 'password'} required className="auth-input pr-10" value={signIn.password} onChange={(e) => setSignIn({ ...signIn, password: e.target.value })} />
                            <button type="button" onClick={() => setShowSignInPassword(!showSignInPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                              {showSignInPassword ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                            </button>
                          </div>
                          <div className="text-right mt-1">
                            <span onClick={() => { setResetEmail(signIn.email); setForgotOpen(true); }} className="text-[#CC0000] text-xs cursor-pointer hover:underline">Forgot password?</span>
                          </div>
                        </div>
                        <Button type="submit" className="ripple-btn w-full btn-primary-gradient mt-2" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="signup">
                      <form onSubmit={handleSignUp} className="space-y-3 mt-3">
                        <div><Label className="text-white/80">Full name</Label><Input required className="auth-input" value={signUp.full_name} onChange={(e) => setSignUp({ ...signUp, full_name: e.target.value })} /></div>
                        <div><Label className="text-white/80">Email</Label><Input type="email" required className="auth-input" value={signUp.email} onChange={(e) => setSignUp({ ...signUp, email: e.target.value })} /></div>
                        <div>
                          <Label className="text-white/80">Password</Label>
                          <div className="relative">
                            <Input type={showSignUpPassword ? 'text' : 'password'} required minLength={6} className="auth-input pr-10" value={signUp.password} onChange={(e) => setSignUp({ ...signUp, password: e.target.value })} />
                            <button type="button" onClick={() => setShowSignUpPassword(!showSignUpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                              {showSignUpPassword ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-white/80">Confirm Password</Label>
                          <div className="relative">
                            <Input type={showSignUpConfirm ? 'text' : 'password'} required minLength={6} className="auth-input pr-10" value={signUp.confirm_password} onChange={(e) => setSignUp({ ...signUp, confirm_password: e.target.value })} />
                            <button type="button" onClick={() => setShowSignUpConfirm(!showSignUpConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                              {showSignUpConfirm ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-white/80">I am a...</Label>
                          <Select value={signUp.role} onValueChange={(v) => setSignUp({ ...signUp, role: v })}>
                            <SelectTrigger className="auth-input"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#111111] border-white/10 text-white">
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="client">Client / Business</SelectItem>
                              <SelectItem value="instructor">Instructor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="ripple-btn w-full btn-primary-gradient mt-2" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  {/* Forgot Password Modal */}
                  {forgotOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="bg-[#0F0F0F] border border-[rgba(26,107,26,0.3)] rounded-xl p-6 w-full max-w-sm">
                        {!resetSent ? (
                          <>
                            <h3 className="text-lg font-bold text-white mb-2">Reset your password</h3>
                            <p className="text-xs text-white/60 mb-4">Enter your email and we'll send you a reset link.</p>
                            <Input 
                              type="email" 
                              placeholder="Email address"
                              value={resetEmail} 
                              onChange={e => setResetEmail(e.target.value)} 
                              className="auth-input mb-4" 
                            />
                            <div className="flex gap-3">
                              <Button variant="ghost" onClick={() => { setForgotOpen(false); setResetSent(false); setResetEmail(''); }} className="flex-1 text-white/60 hover:text-white hover:bg-white/5">Cancel</Button>
                              <Button 
                                onClick={async () => {
                                  if (!resetEmail) return;
                                  setResetLoading(true);
                                  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                                    redirectTo: `${publicBase}/auth/reset-password`
                                  });
                                  setResetLoading(false);
                                  if (error) toast.error(error.message);
                                  else setResetSent(true);
                                }} 
                                disabled={resetLoading}
                                className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/80 text-white"
                              >
                                {resetLoading ? "Sending..." : "Send Reset Link"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-4">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Check your email!</h3>
                            <p className="text-xs text-white/60 mb-6">We sent a password reset link to {resetEmail}. Click the link in the email to set a new password.</p>
                            <Button onClick={() => { setForgotOpen(false); setResetSent(false); setResetEmail(''); }} className="w-full bg-[#1A6B1A] hover:bg-[#1A6B1A]/80 text-white">Back to sign in</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}



            <p className="mt-6 text-center text-xs text-white/40">
              <Link to="/" className="hover:underline hover:text-white/70 transition-smooth">← Back to website</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
