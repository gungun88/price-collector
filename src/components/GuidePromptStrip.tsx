"use client";

import { ArrowRight, BookOpenText, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

const GUIDE_PROMPT_STORAGE_PREFIX = "priceai.guidePrompt";
const GUIDE_PROMPT_PREFERENCES_EVENT = "priceai:guide-prompt-preferences-change";
const HIDDEN_ALL_STORAGE_KEY = `${GUIDE_PROMPT_STORAGE_PREFIX}.hiddenAll.v1`;

type GuidePromptLink = {
  label: string;
  href: string;
};

export function GuidePromptStrip({
  label = "买前指南",
  links,
  note,
  ctaHref = "/guides",
  ctaLabel = "查看指南",
  className = "",
  promptId,
}: {
  label?: string;
  links: GuidePromptLink[];
  note?: string;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
  promptId?: string;
}) {
  const pathname = usePathname();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function syncVisibility() {
      setHidden(isGuidePromptHidden(promptId));
      setMenuOpen(false);
    }

    syncVisibility();
    window.addEventListener(GUIDE_PROMPT_PREFERENCES_EVENT, syncVisibility);
    window.addEventListener("storage", syncVisibility);

    return () => {
      window.removeEventListener(GUIDE_PROMPT_PREFERENCES_EVENT, syncVisibility);
      window.removeEventListener("storage", syncVisibility);
    };
  }, [promptId]);

  useEffect(() => {
    if (!menuOpen) return;

    const frame = window.requestAnimationFrame(() => firstMenuItemRef.current?.focus());

    function onPointerDown(event: MouseEvent) {
      if (!(event.target instanceof Node)) return;
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (hidden) return null;

  const canDismiss = Boolean(promptId);

  return (
    <section
      className={`rounded-lg bg-white px-4 py-3 shadow-[0_14px_42px_rgba(45,52,53,0.035)] ring-1 ring-[#adb3b4]/15 ${className}`}
      aria-label={label}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#5a6061]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#47657a]">
            <BookOpenText className="h-[15px] w-[15px]" />
            {label}
          </span>
          {links.map((link, index) => (
            <span key={`${link.href}-${index}`} className="inline-flex min-w-0 items-center gap-3">
              {index > 0 ? <span className="h-1 w-1 shrink-0 rounded-full bg-[#adb3b4]" aria-hidden="true" /> : null}
              <Link href={link.href} className="font-semibold text-[#202829] transition hover:text-[#2f7a4b]">
                {link.label}
              </Link>
            </span>
          ))}
          {note ? (
            <>
              <span className="hidden h-1 w-1 shrink-0 rounded-full bg-[#adb3b4] sm:inline-block" aria-hidden="true" />
              <span className="text-xs text-[#5a6061]">{note}</span>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={ctaHref}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#202829]"
          >
            {ctaLabel}
            <ArrowRight size={15} />
          </Link>
          {canDismiss ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5a6061] transition hover:bg-[#edf0f1] hover:text-[#202829] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#202829]"
                aria-label="关闭指南提示"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuOpen ? menuId : undefined}
              >
                <X size={16} aria-hidden="true" />
              </button>
              {menuOpen ? (
                <div
                  id={menuId}
                  role="menu"
                  className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-lg bg-white py-1 shadow-[0_18px_45px_rgba(45,52,53,0.14)] ring-1 ring-[#adb3b4]/25"
                >
                  <button
                    ref={firstMenuItemRef}
                    type="button"
                    role="menuitem"
                    onClick={() => dismissGuidePrompt("single")}
                    className="flex w-full items-center px-3.5 py-2.5 text-left text-sm font-semibold text-[#2d3435] transition hover:bg-[#f2f4f4] focus:bg-[#f2f4f4] focus:outline-none"
                  >
                    隐藏这条
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => dismissGuidePrompt("all")}
                    className="flex w-full items-center px-3.5 py-2.5 text-left text-sm font-semibold text-[#2d3435] transition hover:bg-[#f2f4f4] focus:bg-[#f2f4f4] focus:outline-none"
                  >
                    隐藏所有指南提示
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );

  function dismissGuidePrompt(scope: "single" | "all") {
    if (!promptId) return;

    const storageKey = scope === "all" ? HIDDEN_ALL_STORAGE_KEY : guidePromptStorageKey(promptId);
    const persisted = writeStorage(storageKey, new Date().toISOString());
    setHidden(true);
    setMenuOpen(false);
    if (persisted) window.dispatchEvent(new Event(GUIDE_PROMPT_PREFERENCES_EVENT));
    trackAnalyticsEvent("guide_prompt_dismiss", {
      prompt_id: promptId,
      scope,
      pathname,
    });
  }
}

function isGuidePromptHidden(promptId?: string) {
  if (readStorage(HIDDEN_ALL_STORAGE_KEY)) return true;
  if (!promptId) return false;
  return Boolean(readStorage(guidePromptStorageKey(promptId)));
}

function guidePromptStorageKey(promptId: string) {
  return `${GUIDE_PROMPT_STORAGE_PREFIX}.hidden.${promptId}.v1`;
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    /* Browsers with disabled storage still hide the prompt for the current render. */
    return false;
  }
}
