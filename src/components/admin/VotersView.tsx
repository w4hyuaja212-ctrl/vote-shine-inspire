import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, CheckCircle2, Clock } from "lucide-react";

interface Token { id: string; code: string; label: string | null; used: boolean; used_at: string | null; created_at: string; }
interface Vote { token_id: string; category_id: string; candidate_id: string; }
interface Cat { id: string; name: string; display_order: number; }
interface Cand { id: string; name: string; }

export default function VotersView() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [cands, setCands] = useState<Cand[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [t, v, c, cd] = await Promise.all([
        supabase.from("vote_tokens").select("*").order("created_at", { ascending: false }),
        supabase.from("votes").select("token_id, category_id, candidate_id"),
        supabase.from("categories").select("id, name, display_order").order("display_order"),
        supabase.from("candidates").select("id, name"),
      ]);
      setTokens(t.data || []);
      setVotes(v.data || []);
      setCats(c.data || []);
      setCands(cd.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-center py-12">Memuat...</p>;

  const candMap = new Map(cands.map((c) => [c.id, c.name]));
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  const filtered = tokens
    .filter((t) => filter === "all" || (filter === "used" ? t.used : !t.used))
    .filter((t) =>
      !q ||
      t.code.toLowerCase().includes(q.toLowerCase()) ||
      (t.label || "").toLowerCase().includes(q.toLowerCase())
    );

  const usedCount = tokens.filter((t) => t.used).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Kode" value={tokens.length} />
        <Stat label="Sudah Memilih" value={usedCount} accent />
        <Stat label="Belum Memilih" value={tokens.length - usedCount} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode atau label..." className="pl-9" />
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {(["all", "used", "unused"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 text-sm rounded ${filter === k ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >
              {k === "all" ? "Semua" : k === "used" ? "Sudah" : "Belum"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Tidak ada data.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const tokenVotes = votes.filter((v) => v.token_id === t.id);
              const isOpen = openId === t.id;
              return (
                <div key={t.id}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : t.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left"
                  >
                    {t.used ? (
                      isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : <span className="w-4 shrink-0" />}
                    <span className="font-mono font-semibold tracking-wider">{t.code}</span>
                    {t.label && <span className="text-sm text-muted-foreground truncate">— {t.label}</span>}
                    <span className="ml-auto flex items-center gap-3 text-xs">
                      {t.used ? (
                        <>
                          <span className="text-muted-foreground hidden sm:inline">
                            {t.used_at ? new Date(t.used_at).toLocaleString("id-ID") : ""}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <Clock className="w-3 h-3" /> Belum
                        </span>
                      )}
                    </span>
                  </button>
                  {isOpen && t.used && (
                    <div className="px-4 pb-4 pl-11 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">
                        Memilih pada {t.used_at ? new Date(t.used_at).toLocaleString("id-ID") : "-"}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {cats.map((c) => {
                          const v = tokenVotes.find((x) => x.category_id === c.id);
                          return (
                            <div key={c.id} className="flex justify-between gap-2 text-sm bg-background rounded px-3 py-2 border border-border">
                              <span className="text-muted-foreground">{c.name}</span>
                              <span className="font-medium text-right">
                                {v ? candMap.get(v.candidate_id) || "-" : <em className="text-muted-foreground">tidak ada</em>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border shadow-soft ${accent ? "bg-gold text-accent-foreground border-accent" : "bg-card border-border"}`}>
      <div className="text-xs opacity-75">{label}</div>
      <div className="font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
