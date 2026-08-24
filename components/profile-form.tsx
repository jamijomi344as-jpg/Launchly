"use client";

import { useState } from "react";
import { Check, Loader2, UploadCloud } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";
import { initials } from "@/lib/utils";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [values, setValues] = useState({
    full_name: profile.full_name ?? "",
    bio: profile.bio ?? "",
    skills: (profile.skills ?? []).join(", "),
    company_name: profile.company_name ?? "",
    phone: profile.phone ?? "",
    github_url: profile.github_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    website_url: profile.website_url ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function uploadAvatar(file: File) {
    const supabase = getSupabase();
    if (!supabase) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `avatars/${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("project-images")
      .upload(path, file, { upsert: true });
    if (upErr) throw new Error(`Avatar yuklashda xatolik: ${upErr.message}`);
    const { data } = supabase.storage.from("project-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar 2 MB dan kichik bo‘lsin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      const supabase = getSupabase();
      if (!supabase) return;
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
      if (error) throw new Error(error.message);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar yuklanmadi.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    setDone(false);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name.trim(),
        bio: values.bio.trim() || null,
        skills: values.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        company_name: values.company_name.trim() || null,
        phone: values.phone.trim() || null,
        github_url: values.github_url.trim() || null,
        linkedin_url: values.linkedin_url.trim() || null,
        website_url: values.website_url.trim() || null
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-accent-soft text-lg font-black text-accent">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(profile.full_name)
          )}
        </span>
        <div className="flex-1">
          <label className="btn-secondary !py-2 text-xs">
            <UploadCloud size={14} /> Avatar yuklash
            <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="pfm-name" className="label">
          To‘liq ism
        </label>
        <input
          id="pfm-name"
          className="input"
          value={values.full_name}
          onChange={(e) => set("full_name", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="pfm-bio" className="label">
          Bio
        </label>
        <textarea
          id="pfm-bio"
          className="input min-h-[80px] resize-y"
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="O‘zingiz va ishingiz haqida qisqacha…"
        />
      </div>
      <div>
        <label htmlFor="pfm-skills" className="label">
          Skills (vergul bilan ajrating)
        </label>
        <input
          id="pfm-skills"
          className="input"
          value={values.skills}
          onChange={(e) => set("skills", e.target.value)}
          placeholder="Next.js, Supabase, TypeScript"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pfm-company" className="label">
            Kompaniya
          </label>
          <input
            id="pfm-company"
            className="input"
            value={values.company_name}
            onChange={(e) => set("company_name", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="pfm-phone" className="label">
            Telefon
          </label>
          <input
            id="pfm-phone"
            className="input"
            type="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pfm-github" className="label">
            GitHub
          </label>
          <input
            id="pfm-github"
            className="input"
            value={values.github_url}
            onChange={(e) => set("github_url", e.target.value)}
            placeholder="https://github.com/user"
          />
        </div>
        <div>
          <label htmlFor="pfm-linkedin" className="label">
            LinkedIn
          </label>
          <input
            id="pfm-linkedin"
            className="input"
            value={values.linkedin_url}
            onChange={(e) => set("linkedin_url", e.target.value)}
            placeholder="https://linkedin.com/in/user"
          />
        </div>
      </div>
      <div>
        <label htmlFor="pfm-website" className="label">
          Website
        </label>
        <input
          id="pfm-website"
          className="input"
          value={values.website_url}
          onChange={(e) => set("website_url", e.target.value)}
          placeholder="https://siz.uz"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {done && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          Profil ma’lumotlaringiz saqlandi.
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Check size={15} />
        )}
        Saqlash
      </button>
    </form>
  );
}
