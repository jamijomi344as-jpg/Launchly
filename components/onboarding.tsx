"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Rocket,
  Sparkles,
  Star,
  Tag as TagIcon,
  Trophy,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ONBOARDING_STORAGE_KEY = "launchly-onboarding-v1";
export const ONBOARDING_OPEN_EVENT = "launchly:open-onboarding";

type Step = {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  text: string;
  points: string[];
};

const STEPS: Step[] = [
  {
    icon: <Rocket size={26} />,
    emoji: "🚀",
    title: "Launchly’ga xush kelibsiz!",
    text: "Launchly — o‘zbek dasturchilari, startapchilari va investorlari uchun yagona maydon. Bu yerda loyihangizni ko‘rsatasiz, samimiy feedback olasiz va hamkor topasiz.",
    points: [
      "Loyihangizni bir necha daqiqada e’lon qiling",
      "Boshqalarning ishlarini kashf qiling",
      "Hammasi o‘zbek tilida va bepul"
    ]
  },
  {
    icon: <TagIcon size={26} />,
    emoji: "🏷️",
    title: "Kashfiyot — kerakligini tez toping",
    text: "Loyihalar, mahsulotlar va buyurtmalar kategoriyalar hamda taglar bo‘yicha tartiblangan. Qidiruv va filtrlar bilan aynan sizga keraklisini bir zumda topasiz.",
    points: [
      "Tag va kategoriya bo‘yicha filtr",
      "Nomi yoki tavsifi bo‘yicha qidiruv",
      "Yangi, mashhur va eng yuqori baholanganlar tartibi"
    ]
  },
  {
    icon: <Star size={26} />,
    emoji: "⭐",
    title: "Feedback va reyting",
    text: "Har bir loyihaga g‘oya, dizayn va ijro bo‘yicha baho bering, layk bosing va izoh qoldiring. Samimiy fikr — bu yerda eng qimmatli valyuta.",
    points: [
      "G‘oya · Dizayn · Ijro bo‘yicha 3 ta baho",
      "Layk va izohlar bilan muallifni qo‘llab-quvvatlang",
      "Yoqqanini saqlab qo‘ying va keyin qaytib keling"
    ]
  },
  {
    icon: <Trophy size={26} />,
    emoji: "🏆",
    title: "Reyting va trendlar",
    text: "Eng ko‘p baho va qiziqish yig‘gan loyihalar bosh sahifada ko‘rinadi. Haftalik TOP loyiha va 🔥 trenddagi ishlar bilan tanishing.",
    points: [
      "Haftaning TOP loyihasi banneri",
      "Trenddagi loyiha va mahsulotlar",
      "Reytingingiz yaxshilansa — ko‘rinishingiz oshadi"
    ]
  },
  {
    icon: <Briefcase size={26} />,
    emoji: "💼",
    title: "Buyurtma bozori",
    text: "Ish izlayapsizmi yoki ijrochi kerakmi? Buyurtma bozorida ochiq takliflarni ko‘ring, o‘z buyurtmangizni joylang yoki tayyor mahsulotlarni soting.",
    points: [
      "Ochiq buyurtmalar va byudjetlar",
      "Ijrochi bilan to‘g‘ridan-to‘g‘ri yozishma",
      "Tayyor mahsulotlarni e’lon qilish"
    ]
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Birinchi tashrifda avtomatik ochiladi.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage bloklangan bo'lsa — jimgina o'tkazib yuboramiz.
    }
  }, []);

  // Footer'dagi "Tanishuv" havolasi orqali qayta ochish.
  useEffect(() => {
    const onOpen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ONBOARDING_OPEN_EVENT, onOpen);
  }, []);

  const remember = useCallback(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // e'tiborsiz
    }
  }, []);

  const close = useCallback(() => {
    remember();
    setOpen(false);
  }, [remember]);

  // "Boshlash" — oynani yopadi va bosh sahifaga o'tkazadi.
  const start = useCallback(() => {
    remember();
    setOpen(false);
    router.push("/");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [remember, router]);

  const go = useCallback((next: number) => {
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + next)));
  }, []);

  const jump = useCallback((index: number) => {
    setStep(index);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, go]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="animate-onboarding-fade fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Launchly bilan tanishuv"
    >
      <div className="animate-onboarding-pop flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-card sm:max-w-xl sm:rounded-3xl">
        {/* Progress */}
        <div className="h-1 w-full bg-surface-2">
          <div
            className="h-full rounded-r-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} />
            Tanishuv · {step + 1}/{STEPS.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Yopish"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {/* Slayd */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 pt-4 sm:px-7">
          <div key={step} className="animate-onboarding-slide">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white">
              {current.icon}
            </span>
            <h2 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="mr-1.5" aria-hidden>
                {current.emoji}
              </span>
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{current.text}</p>
            <ul className="mt-4 space-y-2">
              {current.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-black text-accent">
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Nuqtalar */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => jump(i)}
              aria-label={`${i + 1}-qadam: ${s.title}`}
              aria-current={i === step}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-6 bg-accent" : "w-2 bg-surface-2 hover:bg-muted/40"
              )}
            />
          ))}
        </div>

        {/* Tugmalar */}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-4 sm:px-7">
          {step > 0 ? (
            <button type="button" onClick={() => go(-1)} className="btn-ghost">
              <ArrowLeft size={15} /> Orqaga
            </button>
          ) : (
            <button type="button" onClick={close} className="btn-ghost">
              O‘tkazib yuborish
            </button>
          )}

          {isLast ? (
            <button type="button" onClick={start} className="btn-primary">
              Boshlash <ArrowRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={() => go(1)} className="btn-primary">
              Keyingisi <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
