"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { isSupabaseConfigured } from "@/lib/config";
import { PROJECT_CATEGORIES, slugify } from "@/lib/utils";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./ui";

const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 4;
const MAX_TAGS = 3;

interface FormState {
  title: string;
  short_description: string;
  description: string;
  category: string;
  status: string;
  demo_url: string;
  repo_url: string;
  slug: string;
  slugEdited: boolean;
}

const INITIAL: FormState = {
  title: "",
  short_description: "",
  description: "",
  category: "",
  status: "idea",
  demo_url: "",
  repo_url: "",
  slug: "",
  slugEdited: false
};

export default function ProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    // Tag katalogi migratsiyada hali yaratilmagan bo'lsa — jimboyib o'tamiz.
    void supabase
      .from("tags")
      .select("id, name, slug")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) setTags(data as Tag[]);
      });
  }, []);

  function toggleTag(id: number) {
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, id];
    });
  }

  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        title="Loyiha joylash uchun avval Supabase ulanishini sozlang"
        text="NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY o‘zgarishlarini .env.local fayliga yozing va serverni qayta ishga tushiring."
      />
    );
  }

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && !f.slugEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 3) e.title = "Loyiha nomi kamida 3 ta belgidan iborat bo‘lsin.";
    if (!form.short_description.trim()) e.short_description = "Qisqa tavsif majburiy.";
    if (form.short_description.trim().length > 160)
      e.short_description = "Qisqa tavsif 160 belgidan oshmasin.";
    if (!form.category) e.category = "Kategoriyani tanlang.";
    const validUrl = (v: string) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/.test(v);
    if (!validUrl(form.demo_url.trim())) e.demo_url = "Demo havola https:// ko‘rinishida bo‘lsin.";
    if (!validUrl(form.repo_url.trim())) e.repo_url = "GitHub havola https:// ko‘rinishida bo‘lsin.";
    if (!form.slug.trim() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug))
      e.slug = "Slug faqat kichik harflar, raqamlar va sheriton bo‘lsin.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.push("/auth/login");
        return;
      }
      const uid = session.user.id;

      // Upload screenshots to the public Storage bucket.
      const imageUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "png";
        const path = `projects/${uid}/${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_").slice(-40)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("project-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false
        });
        if (upErr) throw new Error(`Rasm yuklashda xatolik: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("project-images").getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }

      const { data: inserted, error: insErr } = await supabase
        .from("projects")
        .insert({
        owner_id: uid,
        title: form.title.trim(),
        slug: form.slug.trim(),
        short_description: form.short_description.trim(),
        description: form.description.trim(),
        category: form.category,
        status: form.status,
        images: imageUrls,
        demo_url: form.demo_url.trim() || null,
        repo_url: form.repo_url.trim() || null
      })
      .select("id")
      .single();
      if (insErr) {
        if (insErr.code === "23505") {
          setServerError("Bu slug allaqachon band. Boshqa nom tanlab ko‘ring.");
        } else if (insErr.code === "42501") {
          setServerError("Ruxsat yo‘q: loyiha joylashish faqat developer roll uchun ochiq.");
        } else {
          setServerError(insErr.message);
        }
        return;
      }

      // Tanlangan taglarni bog'lash (maksimum 3).
      if (selectedTagIds.length > 0 && inserted?.id) {
        await supabase.from("project_tags").insert(
          selectedTagIds.map((tag_id) => ({
            project_id: inserted.id,
            tag_id
          }))
        );
      }

      router.push(`/p/${form.slug.trim()}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Noma’lum xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6" noValidate>
      <div>
        <label htmlFor="pf-title" className="label">
          Loyiha nomi <span className="text-rose-500">*</span>
        </label>
        <input
          id="pf-title"
          className="input"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Masalan: Oqbank — moliyaviy boshqaruv"
          maxLength={80}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div>
        <label htmlFor="pf-short" className="label">
          Qisqa tavsif <span className="text-rose-500">*</span>
        </label>
        <input
          id="pf-short"
          className="input"
          value={form.short_description}
          onChange={(e) => set("short_description", e.target.value)}
          placeholder="Bitta jumla bilan loyihangiz nima qiladi?"
          maxLength={160}
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          {errors.short_description ? (
            <span className="field-error !mt-0">{errors.short_description}</span>
          ) : (
            <span />
          )}
          <span>{form.short_description.length}/160</span>
        </div>
      </div>

      <div>
        <label htmlFor="pf-desc" className="label">
          To‘liq tavsif
        </label>
        <textarea
          id="pf-desc"
          className="input min-h-[140px] resize-y"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Loyiha haqida batafsil: muammo, yechim, texnologiyalar, rejalar…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-category" className="label">
            Kategoriya <span className="text-rose-500">*</span>
          </label>
          <select
            id="pf-category"
            className="input"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Tanlang…</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>
        <div>
          <label htmlFor="pf-status" className="label">
            Holat
          </label>
          <select
            id="pf-status"
            className="input"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="idea">G‘oya</option>
            <option value="mvp">MVP</option>
            <option value="in_progress">Jarayonda</option>
            <option value="launched">Ishga tushgan</option>
          </select>
        </div>
      </div>

      {tags.length > 0 && (
        <div>
          <span className="label" id="pf-tags-label">
            Taglar{" "}
            <span className="font-normal text-muted">
              (ixtiyoriy, eng ko‘pi bilan {MAX_TAGS} ta)
            </span>
          </span>
          <div
            role="group"
            aria-labelledby="pf-tags-label"
            className="flex flex-wrap gap-2"
          >
            {tags.map((t) => {
              const selected = selectedTagIds.includes(t.id);
              const disabled =
                !selected && selectedTagIds.length >= MAX_TAGS;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => toggleTag(t.id)}
                  title={disabled ? `Eng ko‘pi bilan ${MAX_TAGS} ta tag` : undefined}
                  className={cn(
                    "chip transition",
                    selected
                      ? "!bg-accent !text-white"
                      : "hover:text-ink",
                    disabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Taglar loyihangiz tegishli yo‘nalishlarni ko‘rsatadi — katalog
            sahifalarida (/tags/…) ko‘rinadi va qidiruvga tushadi.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-demo" className="label">
            Demo havola
          </label>
          <input
            id="pf-demo"
            className="input"
            value={form.demo_url}
            onChange={(e) => set("demo_url", e.target.value)}
            placeholder="https://demo.misol.uz"
            inputMode="url"
          />
          {errors.demo_url && <span className="field-error">{errors.demo_url}</span>}
        </div>
        <div>
          <label htmlFor="pf-repo" className="label">
            GitHub havola
          </label>
          <input
            id="pf-repo"
            className="input"
            value={form.repo_url}
            onChange={(e) => set("repo_url", e.target.value)}
            placeholder="https://github.com/user/repo"
            inputMode="url"
          />
          {errors.repo_url && <span className="field-error">{errors.repo_url}</span>}
        </div>
      </div>

      <div>
        <label htmlFor="pf-slug" className="label">
          Slug (URL nomi)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted">/p/</span>
          <input
            id="pf-slug"
            className="input"
            value={form.slug}
            onChange={(e) => {
              setForm((f) => ({ ...f, slug: e.target.value, slugEdited: true }));
            }}
            placeholder="loyiha-nomi"
          />
        </div>
        {errors.slug && <span className="field-error">{errors.slug}</span>}
      </div>

      <div>
        <span className="label">
          Ekran rasmlari <span className="font-normal text-muted">(eng ko‘pi bilan {MAX_IMAGES} ta, har biri {MAX_IMAGE_MB} MB gacha)</span>
        </span>
        <label
          htmlFor="pf-images"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface-2/50 px-4 py-8 text-center transition hover:border-accent hover:bg-accent-soft/40"
        >
          <UploadCloud size={22} className="text-accent" />
          <span className="text-sm font-semibold">Rasmlarni tanlang yoki shu yerga tashlang</span>
          <span className="text-xs text-muted">PNG, JPG, WEBP</span>
          <input
            id="pf-images"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              setFiles((prev) => {
                const next = [...prev];
                for (const f of list) {
                  if (next.length >= MAX_IMAGES) break;
                  if (f.size > MAX_IMAGE_MB * 1024 * 1024) continue;
                  next.push(f);
                }
                return next;
              });
              e.target.value = "";
            }}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="relative">
                <img
                  src={URL.createObjectURL(f)}
                  alt={`Rasm ${i + 1}`}
                  className="aspect-video w-full rounded-lg border border-line object-cover"
                />
                <button
                  type="button"
                  aria-label={`${f.name} rasmini olib tashlash`}
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Joylanmoqda…
          </>
        ) : (
          <>
            <ImagePlus size={15} /> Loyihani joylash
          </>
        )}
      </button>
    </form>
  );
}
