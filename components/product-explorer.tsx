"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  DollarSign,
  Gift,
  Loader2,
  Plus,
  ShoppingBag,
  UploadCloud,
  X
} from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import type { Product } from "@/lib/types";
import { cn, formatMoney, initials } from "@/lib/utils";
import Modal from "./modal";
import { EmptyState, ErrorState, SkeletonGrid } from "./ui";

const CURRENCIES = ["USD", "UZS", "EUR"];

function ProductImage({ product, className }: { product: Product; className?: string }) {
  if (product.images && product.images.length > 0) {
    return (
      <img
        src={product.images[0]}
        alt={product.title}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft via-surface-2 to-surface">
      <span className="text-3xl font-black tracking-tight text-accent/50">
        {initials(product.title)}
      </span>
    </div>
  );
}

export default function ProductExplorer() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    setProducts(null);
    const supabase = getSupabase();
    if (!supabase) {
      setProducts([]);
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles(id, full_name, avatar_url, role)")
      .order("created_at", { ascending: false });
    if (error) {
      setError(true);
      return;
    }
    setProducts(data ?? []);
  }, []);

  useEffect(() => {
    void load();
    (async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUser(data.user?.id ?? null);
    })();
  }, [load]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {products == null ? "Yuklanmoqda…" : `${products.length} ta mahsulot`}
        </p>
        {user ? (
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={15} /> Mahsulot joylash
          </button>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="btn-secondary">
              Kirish
            </Link>
            <Link href="/auth/signup" className="btn-primary">
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        )}
      </div>

      {products === null && !error && <SkeletonGrid count={4} />}
      {error && <ErrorState title="Mahsulotlarni yuklab bo‘lmadi" onRetry={() => void load()} />}
      {!error && products && products.length === 0 && (
        <EmptyState
          icon={<ShoppingBag size={22} />}
          title="Hali mahsulotlar yo‘q"
          text="Ishga tushirgan mahsulotingizni vitrinaga joylang — bepul yoki pullik."
          action={
            user ? (
              <button type="button" onClick={() => setCreating(true)} className="btn-primary">
                <Plus size={15} /> Mahsulot joylash
              </button>
            ) : (
              <Link href="/auth/signup" className="btn-primary">
                Ro‘yxatdan o‘tish
              </Link>
            )
          }
        />
      )}
      {!error && products && products.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="card group overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                <ProductImage product={p} className="transition duration-300 group-hover:scale-[1.03]" />
                <span
                  className={cn(
                    "badge absolute left-3 top-3",
                    p.is_paid ? "bg-amber-500/90 text-white" : "bg-emerald-500/90 text-white"
                  )}
                >
                  {p.is_paid ? formatMoney(p.price) : "Bepul"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-bold transition group-hover:text-accent">
                  {p.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted">
                  {p.description || "Tavsif kiritilmagan"}
                </p>
                {p.profiles && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-[8px] font-bold text-accent">
                      {p.profiles.avatar_url ? (
                        <img src={p.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(p.profiles.full_name)
                      )}
                    </span>
                    <span className="truncate">{p.profiles.full_name || "Foydalanuvchi"}</span>
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.title ?? ""} wide>
        {selected && (
          <div className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-xl bg-surface-2">
              <ProductImage product={selected} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "badge",
                  selected.is_paid ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                )}
              >
                {selected.is_paid ? (
                  <>
                    <DollarSign size={11} /> {formatMoney(selected.price)} {selected.currency}
                  </>
                ) : (
                  <>
                    <Gift size={11} /> Bepul
                  </>
                )}
              </span>
              {selected.profiles && (
                <Link
                  href={`/u/${selected.profiles.id}`}
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent"
                >
                  {selected.profiles.avatar_url ? (
                    <img src={selected.profiles.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[8px] font-bold text-accent">
                      {initials(selected.profiles.full_name)}
                    </span>
                  )}
                  {selected.profiles.full_name || "Foydalanuvchi"}
                </Link>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {selected.description || "Tavsif kiritilmagan."}
            </p>
            {selected.demo_url && (
              <a href={selected.demo_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <ExternalLink size={14} /> Demoni ochish
              </a>
            )}
          </div>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="Yangi mahsulot" wide>
        <ProductForm
          onCreated={() => {
            setProducts(null);
            void load();
          }}
        />
      </Modal>
    </div>
  );
}

function ProductForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [demoUrl, setDemoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = "Nomi kamida 3 ta belgidan iborat bo‘lsin.";
    if (isPaid && (price === "" || Number(price) < 0)) e.price = "Pullik mahsulot uchun narx kiriting.";
    if (demoUrl && !/^https?:\/\/[^\s]+$/.test(demoUrl.trim()))
      e.demoUrl = "Demo havola https:// ko‘rinishida bo‘lsin.";
    if (imageUrl && !/^https?:\/\/[^\s]+$/.test(imageUrl.trim()))
      e.imageUrl = "Rasm havolasi https:// ko‘rinishida bo‘lsin.";
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
        window.location.href = "/auth/login";
        return;
      }
      const uid = session.user.id;
      const images: string[] = [];
      if (file) {
        const ext = file.name.split(".").pop() || "png";
        const path = `products/${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_").slice(-40)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("project-images").upload(path, file);
        if (upErr) throw new Error(`Rasm yuklashda xatolik: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("project-images").getPublicUrl(path);
        images.push(pub.publicUrl);
      } else if (imageUrl.trim()) {
        images.push(imageUrl.trim());
      }
      const { error } = await supabase.from("products").insert({
        owner_id: uid,
        title: title.trim(),
        slug: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        description: description.trim(),
        images,
        demo_url: demoUrl.trim() || null,
        price: isPaid ? Number(price) : null,
        currency: isPaid ? currency : "USD",
        is_paid: isPaid
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      onCreated();
      window.location.reload();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Noma’lum xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="prod-title" className="label">
          Mahsulot nomi <span className="text-rose-500">*</span>
        </label>
        <input
          id="prod-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>
      <div>
        <label htmlFor="prod-desc" className="label">
          Tavsif
        </label>
        <textarea
          id="prod-desc"
          className="input min-h-[110px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm font-semibold">
            <span>Pullikmi?</span>
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>
        </div>
        {isPaid && (
          <>
            <div>
              <label htmlFor="prod-price" className="label">
                Narx
              </label>
              <input
                id="prod-price"
                className="input"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>
            <div>
              <label htmlFor="prod-currency" className="label">
                Valyuta
              </label>
              <select
                id="prod-currency"
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
      <div>
        <label htmlFor="prod-demo" className="label">
          Demo havola
        </label>
        <input
          id="prod-demo"
          className="input"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          placeholder="https://mahsulot.uz"
        />
        {errors.demoUrl && <span className="field-error">{errors.demoUrl}</span>}
      </div>
      <div>
        <span className="label">Rasm</span>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              aria-label="Rasm havolasi"
              className="input"
              value={file ? "" : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setFile(null);
              }}
              placeholder="Rasm URL (yoki fayl tanlang)"
            />
          </div>
          {file ? (
            <span className="flex items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold">
              {file.name.slice(0, 18)}
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label="Faylni olib tashlash"
                className="text-muted hover:text-rose-500"
              >
                <X size={14} />
              </button>
            </span>
          ) : (
            <label className="btn-secondary cursor-pointer">
              <UploadCloud size={14} /> Fayl
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setImageUrl("");
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        {errors.imageUrl && <span className="field-error">{errors.imageUrl}</span>}
      </div>
      {serverError && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          Joylash
        </button>
      </div>
    </form>
  );
}
