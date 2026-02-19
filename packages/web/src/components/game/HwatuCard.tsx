"use client";

import { motion } from "framer-motion";
import type { Card } from "@go-stop/shared";

interface HwatuCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  small?: boolean;
  faceDown?: boolean;
}

const MONTH_EMOJI: Record<number, string> = {
  1: "🌲",
  2: "✿",
  3: "🌸",
  4: "🪻",
  5: "🪷",
  6: "🌺",
  7: "🌿",
  8: "🌾",
  9: "🏵️",
  10: "🍁",
  11: "🪴",
  12: "🌧️",
};

const MONTH_COLORS: Record<number, { bg: string; border: string; accent: string }> = {
  1: { bg: "from-emerald-50 to-emerald-100", border: "border-emerald-300", accent: "text-emerald-700" },
  2: { bg: "from-pink-50 to-pink-100", border: "border-pink-300", accent: "text-pink-700" },
  3: { bg: "from-rose-50 to-rose-100", border: "border-rose-300", accent: "text-rose-700" },
  4: { bg: "from-violet-50 to-violet-100", border: "border-violet-300", accent: "text-violet-700" },
  5: { bg: "from-indigo-50 to-indigo-100", border: "border-indigo-300", accent: "text-indigo-700" },
  6: { bg: "from-fuchsia-50 to-fuchsia-100", border: "border-fuchsia-300", accent: "text-fuchsia-700" },
  7: { bg: "from-lime-50 to-lime-100", border: "border-lime-300", accent: "text-lime-700" },
  8: { bg: "from-amber-50 to-amber-100", border: "border-amber-300", accent: "text-amber-700" },
  9: { bg: "from-orange-50 to-orange-100", border: "border-orange-300", accent: "text-orange-700" },
  10: { bg: "from-red-50 to-red-100", border: "border-red-300", accent: "text-red-700" },
  11: { bg: "from-teal-50 to-teal-100", border: "border-teal-300", accent: "text-teal-700" },
  12: { bg: "from-slate-100 to-slate-200", border: "border-slate-400", accent: "text-slate-700" },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bright: { label: "光", color: "bg-amber-500 text-white" },
  animal: { label: "열", color: "bg-emerald-600 text-white" },
  ribbon: { label: "띠", color: "bg-rose-500 text-white" },
  junk: { label: "피", color: "bg-stone-400 text-white" },
};

export function HwatuCard({
  card,
  onClick,
  disabled = false,
  selected = false,
  highlighted = false,
  small = false,
  faceDown = false,
}: HwatuCardProps) {
  const colors = MONTH_COLORS[card.month] ?? MONTH_COLORS[1];
  const typeInfo = TYPE_LABELS[card.type] ?? TYPE_LABELS.junk;

  const sizeClasses = small
    ? "w-12 h-[4.5rem] text-xs"
    : "w-16 h-24 text-sm";

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses} card-shadow flex-shrink-0 rounded-lg border-2 border-crimson-dark
                   bg-gradient-to-br from-crimson to-crimson-dark`}
      >
        <div className="flex h-full items-center justify-center">
          <span className="text-lg font-bold text-white/30">花</span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -4, scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      className={`${sizeClasses} card-shadow relative flex-shrink-0 overflow-hidden rounded-lg border-2
                 bg-gradient-to-br transition-shadow
                 ${colors.bg} ${colors.border}
                 ${selected ? "ring-3 ring-gold shadow-lg shadow-gold/20" : ""}
                 ${highlighted ? "animate-pulse-glow" : ""}
                 ${disabled ? "cursor-default opacity-70" : "cursor-pointer hover:card-shadow-hover"}
                 `}
    >
      {/* Type badge */}
      <div
        className={`absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded
                   text-[8px] font-bold ${typeInfo.color}`}
      >
        {typeInfo.label}
      </div>

      {/* Month number */}
      <div className={`absolute top-0.5 left-1 text-[10px] font-bold ${colors.accent}`}>
        {card.month}
      </div>

      {/* Center content */}
      <div className="flex h-full flex-col items-center justify-center gap-0.5 pt-1">
        <span className={small ? "text-base" : "text-xl"}>
          {MONTH_EMOJI[card.month]}
        </span>
        <span
          className={`line-clamp-2 px-0.5 text-center leading-tight font-medium ${colors.accent} ${small ? "text-[7px]" : "text-[9px]"}`}
        >
          {card.name.split(" ").slice(0, 2).join("\n")}
        </span>
      </div>

      {/* Special indicators */}
      {card.isDoubleJunk && (
        <div className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-amber-600">
          ×2
        </div>
      )}
      {card.isSakeCup && (
        <div className="absolute bottom-0.5 left-0.5 text-[8px]">🍶</div>
      )}
      {card.isBird && (
        <div className="absolute bottom-0.5 right-0.5 text-[8px]">🐦</div>
      )}

      {/* Ribbon indicator */}
      {card.ribbonKind && card.ribbonKind !== "other" && (
        <div
          className={`absolute bottom-0 left-0 h-1 w-full
            ${card.ribbonKind === "red-poem" ? "bg-red-500" : ""}
            ${card.ribbonKind === "red-plain" ? "bg-red-400" : ""}
            ${card.ribbonKind === "blue" ? "bg-blue-500" : ""}
          `}
        />
      )}
    </motion.button>
  );
}
