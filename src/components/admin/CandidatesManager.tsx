import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, User } from "lucide-react";
import { toast } from "sonner";

interface Candidate { id: string; name: string; role_type: string; photo_url: string | null; bio: string | null; }
interface Category { id: string; name: string; }
interface Link { candidate_id: string; category_id: string; }

export default function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState({ name: "", role_type: "guru", photo_url: "", bio: "" });
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());

  const load = async () => {
    const [c, cat, l] = await Promise.all([
      supabase.from("candidates").select("*").order("name"),
      supabase.from("categories").select("id,name").order("display_order"),
      supabase.from("candidate_categories").select("*"),
    ]);
    setCandidates(c.data || []);
    setCategories(cat.data || []);
    setLinks(l.data || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", role_type: "guru", photo_url: "", bio: "" });
    setSelectedCats(new Set(categories.map((c) => c.id))); // default all
    setOpen(true);
  };

  const openEdit = (c: Candidate) => {
    setEditing(c);
    setForm({ name: c.name, role_type: c.role_type, photo_url: c.photo_url || "", bio: c.bio || "" });
    setSelectedCats(new Set(links.filter((l) => l.candidate_id === c.id).map((l) => l.category_id)));
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nama wajib diisi");
    const payload = { ...form, photo_url: form.photo_url || null, bio: form.bio || null };
    let candidateId = editing?.id;
    if (editing) {
      const { error } = await supabase.from("candidates").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase.from("candidates").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      candidateId = data.id;
    }
    if (candidateId) {
      await supabase.from("candidate_categories").delete().eq("candidate_id", candidateId);
      if (selectedCats.size > 0) {
        await supabase.from("candidate_categories").insert(
          Array.from(selectedCats).map((cid) => ({ candidate_id: candidateId!, category_id: cid }))
        );
      }
    }
    toast.success("Tersimpan");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus nominasi ini?")) return;
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    load();
  };

  const toggleCat = (id: string) => {
    const s = new Set(selectedCats);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedCats(s);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl">Nominasi ({candidates.length})</h2>
        <Button onClick={openNew} variant="hero"><Plus className="w-4 h-4 mr-1" /> Tambah</Button>
      </div>

      {candidates.length === 0 ? (
        <p className="text-muted-foreground text-center py-12 bg-card rounded-xl border border-border">
          Belum ada nominasi. Klik "Tambah" untuk membuat.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => {
            const catCount = links.filter((l) => l.candidate_id === c.id).length;
            return (
              <div key={c.id} className="p-4 bg-card border border-border rounded-xl flex gap-3 shadow-soft">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {c.photo_url ? <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{c.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{c.role_type} • {catCount} kategori</p>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Nominasi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tipe</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={form.role_type}
                onChange={(e) => setForm({ ...form, role_type: e.target.value })}
              >
                <option value="guru">Guru</option>
                <option value="karyawan">Karyawan</option>
              </select>
            </div>
            <div>
              <Label>URL Foto (opsional)</Label>
              <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Bio singkat (opsional)</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Eligible di kategori</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedCats.has(cat.id)} onCheckedChange={() => toggleCat(cat.id)} />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={save} variant="hero" className="w-full">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
