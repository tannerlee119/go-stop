"use client";

import { motion } from "framer-motion";
import type { Card } from "@go-stop/shared";
import { getCardSpriteStyle } from "@/lib/card-sprites";

interface HwatuCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  faceDown?: boolean;
}

const SIZE_CLASSES = {
  xs: "w-8 h-12",
  sm: "w-11 h-[66px]",
  md: "w-14 h-[84px]",
  lg: "w-[72px] h-[108px]",
};

export function HwatuCard({
  card,
  onClick,
  disabled = false,
  selected = false,
  highlighted = false,
  size = "md",
  faceDown = false,
}: HwatuCardProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (faceDown) {
    return (
      <div
        className={`${sizeClass} flex-shrink-0 rounded-md border-2 border-red-900
                   bg-gradient-to-br from-red-700 to-red-900 shadow-md`}
      >
        <div className="flex h-full items-center justify-center">
          <div className="h-3/4 w-3/4 rounded-sm border border-red-500/30 bg-red-800/50" />
        </div>
      </div>
    );
  }

  const spriteStyle = getCardSpriteStyle(card.id);

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -6, scale: 1.08 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      className={`${sizeClass} card-shadow relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-shadow
                 ${selected ? "border-yellow-400 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30" : "border-red-800/60"}
                 ${highlighted ? "animate-pulse-glow border-yellow-400" : ""}
                 ${disabled ? "cursor-default" : "cursor-pointer hover:card-shadow-hover"}`}
      style={spriteStyle}
      aria-label={`${card.name} (${card.flower}, Month ${card.month})`}
    />
  );
}
