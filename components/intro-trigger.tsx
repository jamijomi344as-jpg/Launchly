"use client";

import { ONBOARDING_OPEN_EVENT } from "@/components/onboarding";

export default function IntroTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT))}
    >
      Tanishuv
    </button>
  );
}
