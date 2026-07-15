import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, QrCode, Smartphone, Copy } from "lucide-react";
import QRCode from "qrcode";
import { Link } from "@tanstack/react-router";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";
import { setStoredBaseCurrency } from "@/hooks/useDisplayCurrency";

const profileQuery = queryOptions({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Evergreen" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [upi, setUpi] = useState(profile?.upi_id ?? "");
  const [qr, setQr] = useState<string | null>(null);

  const displayName = profile?.display_name || profile?.email?.split("@")[0] || "Evergreen user";
  const upiUrl = upi.trim()
    ? `upi://pay?pa=${encodeURIComponent(upi.trim())}&pn=${encodeURIComponent(displayName)}&cu=INR`
    : null;

  useEffect(() => {
    if (!upiUrl) { setQr(null); return; }
    QRCode.toDataURL(upiUrl, { width: 220, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [upiUrl]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      const prefCurrency = String(fd.get("preferred_currency") || "INR");
      await updateMyProfile({ data: {
        display_name: String(fd.get("display_name") || ""),
        preferred_currency: prefCurrency,
        upi_id: String(fd.get("upi_id") || ""),
        bio: String(fd.get("bio") || ""),
        avatar_url: previewUrl ?? undefined,
      } });
      setStoredBaseCurrency(prefCurrency);
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile saved");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${profile.user_id}/avatar-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      setPreviewUrl(signed?.signedUrl ?? null);
      toast.success("Photo uploaded — don't forget to save.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Profile</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">Your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Personalise how Evergreen shows up — including a UPI QR people can scan to pay you.</p>
      </header>
      <Card className="border-border/60">
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 ring-2 ring-border">
                <AvatarImage src={previewUrl ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/10 text-primary">{profile?.display_name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading…" : "Change photo"}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">PNG/JPG up to 5 MB.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name" name="display_name" defaultValue={profile?.display_name ?? ""} required />
              <div className="space-y-1.5">
                <Label htmlFor="cur">Default currency</Label>
                <Select name="preferred_currency" defaultValue={profile?.preferred_currency ?? "INR"}>
                  <SelectTrigger id="cur"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="upi_id">UPI ID (for your QR)</Label>
                <Input id="upi_id" name="upi_id" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" maxLength={120} />
              </div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={profile?.email ?? ""} readOnly disabled /></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" defaultValue={profile?.bio ?? ""} maxLength={280} rows={3} placeholder="A short, human note about your money goals." />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-border/60 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:items-center">
          <div className="grid place-items-center">
            {qr ? (
              <img src={qr} alt={`UPI QR for ${displayName}`} className="rounded-2xl bg-white p-3 shadow-soft" />
            ) : (
              <div className="grid h-[220px] w-[220px] place-items-center rounded-2xl border border-dashed border-border/60 text-muted-foreground">
                <div className="text-center">
                  <QrCode className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-xs">Add a UPI ID above to generate your QR</p>
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl">Your UPI QR</h2>
            <p className="mt-1 text-sm text-muted-foreground">Anyone with a UPI app — GPay, PhonePe, Paytm, BHIM — can scan this to pay you in INR. Updates instantly when you change the UPI ID.</p>
            {upi.trim() && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm">
                <span className="truncate font-mono">{upi.trim()}</span>
                <Button type="button" variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => { navigator.clipboard.writeText(upi.trim()); toast.success("UPI ID copied"); }} aria-label="Copy UPI ID">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {upiUrl && <a href={upiUrl}><Button type="button" variant="outline" size="sm"><Smartphone className="mr-2 h-4 w-4" /> Open UPI app</Button></a>}
              <Link to="/dashboard"><Button type="button" size="sm"><QrCode className="mr-2 h-4 w-4" /> Pay & track in Quick Pay</Button></Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Tip: download &amp; save the QR image to print at your desk or stall.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, name, defaultValue, required, placeholder }: { label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} maxLength={120} />
    </div>
  );
}