"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

interface OrderFormValues {
  title: string;
  description: string;
  technologies: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
  name: string;
  email: string;
  telegram: string;
  phone: string;
}

const EMPTY: OrderFormValues = {
  title: "",
  description: "",
  technologies: "",
  budget_min: "",
  budget_max: "",
  deadline: "",
  name: "",
  email: "",
  telegram: "",
  phone: ""
};

export default function OrderForm({
  profile,
  onCreated,
  onCancel
}: {
  profile: { id: string; full_name: string | null; email: string | null } | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<OrderFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUser(data.user?.id ?? null);
      if (data.user && profile) {
        setValues((v) => ({
          ...v,
          name: profile.full_name || v.name,
          email: profile.email || v.email
        }));
      }
    })();
  }, [profile]);

  const isGuest = user === null;

  const set = (key: keyof OrderFormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (values.title.trim().length < 5) e.title = "Sarlavha kamida 5 ta belgidan iborat bo‘lsin.";
    if (values.description.trim().length < 20)
      e.description = "Tavsif kamida 20 ta belgidan iborat bo‘lsin — nima kerakligini aniqroq yozing.";
    const min = values.budget_min === "" ? null : Number(values.budget_min);
    const max = values.budget_max === "" ? null : Number(values.budget_max);
    if (min != null && Number.isNaN(min)) e.budget_min = "Byudjet raqam bo‘lsin.";
    if (max != null && Number.isNaN(max)) e.budget_max = "Byudjet raqam bo‘lsin.";
    if (min != null && max != null && min > max) e.budget_max = "Maks byudjet min byudjetdan kichik bo‘lmasin.";
    if (isGuest) {
      if (values.name.trim().length < 2) e.name = "Ismingizni kiriting.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
        e.email = "To‘g‘ri email kiriting — takliflar shu manzilga keladi.";
    }
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
      const { error } = await supabase.from("orders").insert({
        client_id: isGuest ? null : user,
        guest_name: isGuest ? values.name.trim() : null,
        guest_email: isGuest ? values.email.trim() : null,
        title: values.title.trim(),
        description: values.description.trim(),
        technologies: values.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        budget_min: values.budget_min === "" ? null : Number(values.budget_min),
        budget_max: values.budget_max === "" ? null : Number(values.budget_max),
        deadline: values.deadline || null,
        contact_telegram: values.telegram.trim() || null,
        contact_phone: values.phone.trim() || null
      });
      if (error) {
        setServerError(error.message);
        return;
      }
      router.refresh();
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="of-title" className="label">
          Buyurtma sarlavhasi <span className="text-rose-500">*</span>
        </label>
        <input
          id="of-title"
          className="input"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Masalan: Telegram buyurtma bot kerak"
          maxLength={100}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div>
        <label htmlFor="of-desc" className="label">
          Tavsif <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="of-desc"
          className="input min-h-[110px] resize-y"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Nima qilish kerak, nimalar tayyor, qanday natija kutmoqdasiz…"
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div>
        <label htmlFor="of-tech" className="label">
          Texnologiyalar
        </label>
        <input
          id="of-tech"
          className="input"
          value={values.technologies}
          onChange={(e) => set("technologies", e.target.value)}
          placeholder="Next.js, Figma, Node.js (vergul bilan ajrating)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="of-bmin" className="label">
            Min byudjet ($)
          </label>
          <input
            id="of-bmin"
            className="input"
            type="number"
            min={0}
            value={values.budget_min}
            onChange={(e) => set("budget_min", e.target.value)}
            placeholder="300"
          />
          {errors.budget_min && <span className="field-error">{errors.budget_min}</span>}
        </div>
        <div>
          <label htmlFor="of-bmax" className="label">
            Max byudjet ($)
          </label>
          <input
            id="of-bmax"
            className="input"
            type="number"
            min={0}
            value={values.budget_max}
            onChange={(e) => set("budget_max", e.target.value)}
            placeholder="800"
          />
          {errors.budget_max && <span className="field-error">{errors.budget_max}</span>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="of-deadline" className="label">
            Muddat
          </label>
          <input
            id="of-deadline"
            className="input"
            type="date"
            value={values.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </div>
      </div>

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-[13px] font-semibold text-muted">
          Kontakt ma’lumotlari — faqat siz va tanlagan dasturchingiz ko‘radi
        </legend>
        {isGuest && (
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="of-name" className="label">
                Ism <span className="text-rose-500">*</span>
              </label>
              <input
                id="of-name"
                className="input"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ismingiz"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div>
              <label htmlFor="of-email" className="label">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                id="of-email"
                className="input"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="siz@email.uz"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="of-telegram" className="label">
              Telegram
            </label>
            <input
              id="of-telegram"
              className="input"
              value={values.telegram}
              onChange={(e) => set("telegram", e.target.value)}
              placeholder="@username"
            />
          </div>
          <div>
            <label htmlFor="of-phone" className="label">
              Telefon
            </label>
            <input
              id="of-phone"
              className="input"
              type="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+998 90 123 45 67"
            />
          </div>
        </div>
      </fieldset>

      {serverError && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Bekor qilish
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Yuborilmoqda…
            </>
          ) : (
            <>
              <Check size={15} /> Buyurtmani joylash
            </>
          )}
        </button>
      </div>
    </form>
  );
}
