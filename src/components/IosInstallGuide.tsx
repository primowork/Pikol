"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useBackToClose } from "@/lib/use-back-to-close";
import type { IosInstallContext } from "@/lib/ios-install";

type StepIcon = "more" | "share" | "addToHome" | "done";

interface GuideStep {
  icon: StepIcon;
  text: ReactNode;
}

interface Guide {
  steps: GuideStep[];
  note?: string;
  /** איפה בדפדפן נמצא הכפתור של הצעד הראשון - החץ בחלון מצביע לשם */
  pointer: { edge: "top" | "bottom"; label: string } | null;
}

interface IosInstallGuideProps {
  context: IosInstallContext;
  /** "לא עכשיו" */
  onDismiss: () => void;
  /** "הוספתי" - הלקוח כבר הוסיף למסך הבית */
  onInstalled: () => void;
}

const STEP_COUNT_IN_WORDS: Record<number, string> = { 3: "שלושה צעדים", 4: "ארבעה צעדים" };

/** טקסט של כפתור כמו שהוא כתוב על המסך */
function ScreenLabel({ children, iosBlue = false }: { children: ReactNode; iosBlue?: boolean }) {
  return (
    <span
      className={`mx-0.5 inline-block rounded-md bg-white px-1.5 font-semibold shadow-sm ${
        iosBlue ? "text-[#007AFF]" : "text-pikol-brown"
      }`}
    >
      {children}
    </span>
  );
}

/** הסמלים כמו שהם נראים באייפון: שלוש נקודות, שיתוף, הוספה למסך הבית */
function StepIconTile({ icon }: { icon: StepIcon }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#007AFF] shadow-sm"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon === "more" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none" />
          </>
        )}
        {icon === "share" && (
          <>
            <path d="M8.5 9.5H7.5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-7.5a2 2 0 0 0-2-2h-1" />
            <path d="M12 3v11" />
            <path d="M8.5 6.5 12 3l3.5 3.5" />
          </>
        )}
        {icon === "addToHome" && (
          <>
            <rect x="4" y="4" width="16" height="16" rx="4" />
            <path d="M12 8.5v7M8.5 12h7" />
          </>
        )}
        {icon === "done" && <path d="m5.5 12.5 4 4 9-9" />}
      </svg>
    </span>
  );
}

function AppIcon({ size }: { size: number }) {
  return (
    <Image
      src="/icons/apple-touch-icon.png"
      alt=""
      width={size}
      height={size}
      className="rounded-[22%] shadow-sm"
    />
  );
}

/** חץ קופץ שמצביע אל הסרגל של הדפדפן, מחוץ לדף */
function Pointer({ edge, label }: { edge: "top" | "bottom"; label: string }) {
  const arrow = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8 text-pikol-teal motion-safe:animate-bounce"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {edge === "bottom" ? <path d="M12 4v15M6 13l6 6 6-6" /> : <path d="M12 20V5M6 11l6-6 6 6" />}
    </svg>
  );

  return (
    <div className={`flex flex-col items-center gap-1 ${edge === "top" ? "mb-3" : "mt-4"}`}>
      {edge === "top" && arrow}
      <span className="rounded-full bg-pikol-brown px-3 py-1 text-xs font-semibold text-pikol-cream">
        {label}
      </span>
      {edge === "bottom" && arrow}
    </div>
  );
}

function buildGuide({ browser, device, shareInMoreMenu }: IosInstallContext): Guide {
  const addToHome: GuideStep = {
    icon: "addToHome",
    text: (
      <>
        גוללים מעט ובוחרים <ScreenLabel>הוספה למסך הבית</ScreenLabel>
      </>
    ),
  };
  const confirm: GuideStep = {
    icon: "done",
    text: (
      <>
        לוחצים <ScreenLabel iosBlue>הוסף</ScreenLabel> בפינה העליונה
      </>
    ),
  };

  if (browser === "chrome") {
    return {
      steps: [{ icon: "share", text: "לוחצים על כפתור השיתוף בשורת הכתובת" }, addToHome, confirm],
      note: "לא רואים אותו? אפשר גם דרך תפריט שלוש הנקודות ואז שיתוף.",
      pointer: { edge: "top", label: "בשורת הכתובת של כרום" },
    };
  }

  if (browser === "safari" && device === "ipad") {
    return {
      steps: [{ icon: "share", text: "לוחצים על כפתור השיתוף בסרגל העליון" }, addToHome, confirm],
      note: "לא רואים אותו? הוא בתוך תפריט שלוש הנקודות.",
      pointer: { edge: "top", label: "בסרגל העליון של ספארי" },
    };
  }

  if (browser === "safari" && shareInMoreMenu) {
    return {
      steps: [
        { icon: "more", text: "לוחצים על שלוש הנקודות בסרגל שבתחתית המסך" },
        {
          icon: "share",
          text: (
            <>
              בוחרים <ScreenLabel>שיתוף</ScreenLabel>
            </>
          ),
        },
        addToHome,
        confirm,
      ],
      note: "רואים את כפתור השיתוף ישר בסרגל? לוחצים עליו ומדלגים לצעד השלישי.",
      pointer: { edge: "bottom", label: "בסרגל של ספארי, כאן למטה" },
    };
  }

  if (browser === "safari") {
    return {
      steps: [{ icon: "share", text: "לוחצים על כפתור השיתוף בסרגל שבתחתית המסך" }, addToHome, confirm],
      pointer: { edge: "bottom", label: "בסרגל של ספארי, כאן למטה" },
    };
  }

  return {
    steps: [{ icon: "share", text: "פותחים את תפריט השיתוף של הדפדפן" }, addToHome, confirm],
    note: "האפשרות לא מופיעה? פותחים את הכרטיס בספארי ומוסיפים משם.",
    pointer: null,
  };
}

/**
 * הדרכה להוספת הכרטיס למסך הבית באייפון ובאייפד. באנדרואיד יש כפתור
 * התקנה אמיתי (InstallPrompt), אבל באייפון אפל לא מאפשרת לאתר לפתוח את
 * חלון ההוספה - אפשר רק להראות איפה ללחוץ. הצעדים מותאמים לדפדפן: ספארי
 * (כולל iOS 26, שבו השיתוף מוסתר בתוך שלוש הנקודות), כרום, ואייפד.
 */
export default function IosInstallGuide({ context, onDismiss, onInstalled }: IosInstallGuideProps) {
  const [open, setOpen] = useState(false);
  useBackToClose(open, () => setOpen(false));

  const guide = buildGuide(context);
  const atTop = guide.pointer?.edge === "top";

  return (
    <>
      <div className="w-full rounded-2xl border border-pikol-tan/40 bg-white/60 p-4 text-pikol-brown">
        <div className="flex items-center gap-3 text-right">
          <AppIcon size={52} />
          <div>
            <p className="font-semibold">הכרטיס כאפליקציה בטלפון</p>
            <p className="text-xs text-pikol-brown/70">
              אייקון של פיקולו במסך הבית, שנפתח ישר לכרטיס שלכם
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 w-full rounded-full bg-pikol-brown px-5 py-2.5 text-sm font-semibold text-pikol-cream"
        >
          איך מוסיפים? {STEP_COUNT_IN_WORDS[guide.steps.length]}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 block w-full text-xs text-pikol-brown/60 underline"
        >
          לא עכשיו
        </button>
      </div>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex justify-center bg-pikol-brown/60 ${atTop ? "items-start" : "items-end"}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="הוספת הכרטיס למסך הבית"
            className={`max-h-[92vh] w-full max-w-md overflow-y-auto bg-pikol-cream px-5 py-4 text-right text-pikol-brown shadow-xl ${
              atTop ? "rounded-b-3xl" : "rounded-t-3xl"
            }`}
          >
            {atTop && guide.pointer && <Pointer edge="top" label={guide.pointer.label} />}

            <h2 className="text-lg font-bold">הוספת הכרטיס למסך הבית</h2>

            <ol className="mt-3 space-y-3">
              {guide.steps.map((step, index) => (
                <li key={index} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pikol-teal text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <StepIconTile icon={step.icon} />
                  <p className="text-sm leading-relaxed">{step.text}</p>
                </li>
              ))}
            </ol>

            {guide.note && (
              <p className="mt-3 rounded-xl bg-pikol-gold/15 p-2.5 text-xs">{guide.note}</p>
            )}

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/70 p-3">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <AppIcon size={48} />
                <span className="text-[11px]">פיקולו</span>
              </div>
              <p className="text-xs text-pikol-brown/70">
                כך זה ייראה במסך הבית. לחיצה על האייקון פותחת ישר את הכרטיס שלכם, בלי הדפדפן.
              </p>
            </div>

            {context.browser !== "other" && (
              <p className="mt-3 text-[11px] text-pikol-brown/50">
                לא מוצאים את &quot;הוספה למסך הבית&quot;? פותחים את הכרטיס ישירות בספארי ומנסים שוב.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onInstalled();
              }}
              className="mt-4 w-full rounded-full bg-pikol-brown px-5 py-3 font-semibold text-pikol-cream"
            >
              הוספתי ✓
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 block w-full text-xs text-pikol-brown/60 underline"
            >
              סגירה
            </button>

            {!atTop && guide.pointer && <Pointer edge="bottom" label={guide.pointer.label} />}
          </div>
        </div>
      )}
    </>
  );
}
