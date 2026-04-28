import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminAuth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/admin", { replace: true });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Akun dibuat. Hubungi super-admin untuk diberi role admin.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      nav("/admin", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 islamic-pattern">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-accent mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" /> Kembali ke beranda
        </Link>
        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-elegant">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gold mx-auto flex items-center justify-center shadow-gold mb-3">
              <ShieldCheck className="w-7 h-7 text-accent-foreground" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Panel Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Masuk untuk mengelola voting" : "Daftar akun admin baru"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} variant="hero" className="w-full" size="lg">
              {loading ? "..." : mode === "login" ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-sm text-muted-foreground hover:text-accent mt-4 transition-smooth"
          >
            {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
        </div>
      </div>
    </div>
  );
}
