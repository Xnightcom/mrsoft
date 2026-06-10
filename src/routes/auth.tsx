import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  const [signUp, setSignUp] = useState({ email: "", password: "", full_name: "", role: "student" });

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
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signUp.email,
      password: signUp.password,
      options: {
        emailRedirectTo: `${publicBase}/dashboard`,
        data: { full_name: signUp.full_name, role: signUp.role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Check your email to confirm.");
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

      // redirectTo must EXACTLY match a URL listed in:
      //   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
      // Supabase exchanges the OAuth code and then redirects the browser here.
      // The /auth/callback route reads the session from the URL and navigates onward.
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
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <div className="flex-1 grid place-items-center px-4 py-12">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl gradient-primary shadow-glow"><Cpu className="h-6 w-6 text-primary-foreground" /></span>
              <h1 className="mt-4 text-2xl font-bold">Welcome to MRsoft</h1>
              <p className="text-sm text-muted-foreground">Sign in to access your portal</p>
            </div>

            <Button onClick={handleGoogle} variant="outline" className="w-full mb-4" disabled={loading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .5 4.1 1.5l3-3C17.2 1.8 14.8.8 12 .8 7.3.8 3.3 3.5 1.4 7.5l3.5 2.7C5.8 7.2 8.7 5 12 5z"/><path fill="#34A853" d="M23 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6.2c-.3 1.4-1.1 2.6-2.3 3.4l3.5 2.7c2.1-1.9 3.6-4.8 3.6-8.2z"/><path fill="#4A90E2" d="M5 14.2c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L1.4 7.5C.5 9 0 10.4 0 12s.5 3 1.4 4.5L5 14.2z"/><path fill="#FBBC05" d="M12 23.2c3 0 5.5-1 7.4-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.9 1.1-3.3 0-6.2-2.2-7.1-5.3L1.4 16.5C3.3 20.5 7.3 23.2 12 23.2z"/></svg>
              Continue with Google
            </Button>

            <div className="relative my-4 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2 relative z-10">or with email</span>
              <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Sign up</TabsTrigger></TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3 mt-3">
                  <div><Label>Email</Label><Input type="email" required value={signIn.email} onChange={(e) => setSignIn({ ...signIn, email: e.target.value })} /></div>
                  <div><Label>Password</Label><Input type="password" required value={signIn.password} onChange={(e) => setSignIn({ ...signIn, password: e.target.value })} /></div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3 mt-3">
                  <div><Label>Full name</Label><Input required value={signUp.full_name} onChange={(e) => setSignUp({ ...signUp, full_name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" required value={signUp.email} onChange={(e) => setSignUp({ ...signUp, email: e.target.value })} /></div>
                  <div><Label>Password</Label><Input type="password" required minLength={6} value={signUp.password} onChange={(e) => setSignUp({ ...signUp, password: e.target.value })} /></div>
                  <div>
                    <Label>I am a...</Label>
                    <Select value={signUp.role} onValueChange={(v) => setSignUp({ ...signUp, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="client">Client / Business</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">← Back to website</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
