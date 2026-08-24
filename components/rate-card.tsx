"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const DIMENSIONS: Array<{ key: "idea" | "design" | "execution"; label: string; db: string }> = [
  { key: "idea", label: "G‘oya", db: "idea_score" },
  { key: "design", label: "Dizayn", db: "design_score" },
  { key: "execution", label: "Ijro", db: "execution_score" }
];

function StarInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={`${label} bahosi`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label}: ${n} dan 5 gacha`}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Star
              size={18}
              className={cn(
                "transition",
                n <= value ? "fill-amber-400 text-amber-400" : "text-line"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RateCard({ projectId }: { projectId: string }) {
  const [scores, setScores] = useState({ idea: 0, design: 0, execution: 0 });
  const [mine, setMine] = useState(false);
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: ratings } = await supabase
      .from("project_ratings")
      .select("idea_score, design_score, execution_score, user_id")
      .eq("project_id", projectId);
    const rows = ratings ?? [];
    if (rows.length > 0) {
      const sum = rows.reduce(
        (s, r) => s + (r.idea_score + r.design_score + r.execution_score) / 3,
        0
      );
      setAvg(Math.round((sum / rows.length) * 10) / 10);
    } else {
      setAvg(null);
    }
    setCount(rows.length);

    const { data: session } = await supabase.auth.getUser();
    if (session.user) {
      const own = rows.find((r) => r.user_id === session.user.id);
      if (own) {
        setScores({ idea: own.idea_score, design: own.design_score, execution: own.execution_score });
        setMine(true);
      }
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;
    if (scores.idea === 0 || scores.design === 0 || scores.execution === 0) {
      setError("Har bir mezonda 1–5 oralig‘ida baho qo‘ying.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: insErr } = await supabase
      .from("project_ratings")
      .upsert(
        {
          project_id: projectId,
          user_id: session.user.id,
          idea_score: scores.idea,
          design_score: scores.design,
          execution_score: scores.execution
        },
        { onConflict: "project_id,user_id" }
      );
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setDone(true);
    setMine(true);
    await load();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted">
          Baholang
        </h3>
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {avg != null ? avg.toFixed(1) : "—"}
          <span className="text-xs font-semibold text-muted">
            ({count} baho)
          </span>
        </span>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {DIMENSIONS.map((d) => (
          <StarInput
            key={d.key}
            label={d.label}
            value={scores[d.key]}
            onChange={(v) => {
              setScores((s) => ({ ...s, [d.key]: v }));
              setDone(false);
            }}
          />
        ))}
        {error && <span role="alert" className="field-error !mt-0">{error}</span>}
        {done && !error && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Rahmat! Bahoyingiz saqlandi.
          </p>
        )}
        <button type="submit" disabled={saving} className="btn-primary w-full !py-2">
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : mine ? (
            "Bahoni yangilash"
          ) : (
            "Bahoni saqlash"
          )}
        </button>
      </form>
    </div>
  );
}
