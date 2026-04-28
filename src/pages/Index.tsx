import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Award, ShieldCheck, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import VoteFlow from "@/components/voting/VoteFlow";

const Index = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string>("");

  const handleStart = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      toast.error("Masukkan kode voting Anda");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("validate_token", { _code: trimmed });
    setLoading(false);
    if (error) {
      toast.error("Terjadi kesalahan");
      return;
    }
    const row = (data as any[])?.[0];
    if (!row) {
      toast.error("Kode tidak ditemukan");
      return;
    }
    if (row.used) {
      toast.error("Kode ini sudah digunakan");
      return;
    }
    setTokenId(row.token_id);
    setActiveCode(trimmed);
  };

  if (tokenId) {
    return <VoteFlow code={activeCode} onDone={() => { setTokenId(null); setCode(""); setActiveCode(""); }} />;
  }

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      {/* Hero */}
      <header className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative container mx-auto px-6 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/40 bg-accent/10 backdrop-blur-sm mb-6 animate-fade-up">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium tracking-wide">Penghargaan Tahunan Sekolah</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold mb-4 animate-fade-up">
            Anugerah <span className="gradient-text-gold">Guru & Karyawan</span>
            <br />Ter-Inspiratif
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10 animate-fade-up">
            Apresiasi tertinggi untuk pendidik dan karyawan terbaik. Pilih satu nominasi di setiap dari 10 kategori.
          </p>

          <div className="max-w-md mx-auto bg-card/95 backdrop-blur p-6 rounded-2xl shadow-elegant animate-fade-up">
            <label className="text-sm font-medium text-card-foreground block mb-2 text-left">
              Masukkan Kode Voting Anda
            </label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: ABC123"
                className="text-center font-mono tracking-widest text-lg uppercase"
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
              <Button onClick={handleStart} disabled={loading} variant="hero" size="lg">
                {loading ? "..." : <ArrowRight className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-left">
              Kode diberikan oleh panitia. Setiap kode hanya bisa digunakan satu kali.
            </p>
          </div>
        </div>
      </header>

      {/* Categories preview */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-3">
            10 Kategori <span className="gradient-text-gold">Penghargaan</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Setiap pemilih memberikan satu suara di setiap kategori untuk satu nominasi favoritnya.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((c, i) => (
            <div
              key={c.name}
              className="group relative p-5 rounded-xl bg-card-elegant border border-border shadow-soft hover:shadow-elegant transition-smooth hover:-translate-y-1"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Award className="w-6 h-6 text-accent mb-3" />
              <h3 className="font-display text-xl font-semibold text-foreground">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Anugerah Guru & Karyawan Ter-Inspiratif</p>
          <Link to="/admin" className="inline-flex items-center gap-2 hover:text-accent transition-smooth">
            <ShieldCheck className="w-4 h-4" /> Panel Admin
          </Link>
        </div>
      </footer>
    </div>
  );
};

const CATEGORIES = [
  { name: "Ter-Inspiratif", desc: "Memberi motivasi & keteladanan" },
  { name: "Ter-Sabar", desc: "Tenang menghadapi siswa" },
  { name: "Ter-Ramah", desc: "Humble & murah senyum" },
  { name: "Ter-Inovatif", desc: "Selalu menciptakan ide baru" },
  { name: "Ter-Fashionable", desc: "Penampilan rapi & modis" },
  { name: "Ter-Favorit", desc: "Paling disukai siswa" },
  { name: "Ter-Humoris", desc: "Suasana penuh canda tawa" },
  { name: "Ter-Disiplin", desc: "Konsisten & tepat waktu" },
  { name: "Ter-Islami", desc: "Mencerminkan nilai Islam" },
  { name: "Ter-Tegas", desc: "Tegas tanpa menakutkan" },
];

export default Index;
