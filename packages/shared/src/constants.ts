import type { Month } from "./types.js";

export const MONTHS: Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const MONTH_NAMES: Record<Month, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

export const MONTH_FLOWERS: Record<Month, string> = {
  1: "Pine",
  2: "Plum",
  3: "Cherry",
  4: "Wisteria",
  5: "Iris",
  6: "Peony",
  7: "Bush Clover",
  8: "Pampas",
  9: "Chrysanthemum",
  10: "Maple",
  11: "Paulownia",
  12: "Willow",
};

export const MONTH_KOREAN: Record<Month, string> = {
  1: "송학 (Songhak)",
  2: "매화 (Maehwa)",
  3: "벚꽃 (Beotkkot)",
  4: "등나무 (Deungnamu)",
  5: "난초 (Nancho)",
  6: "모란 (Moran)",
  7: "싸리 (Ssari)",
  8: "공산 (Gongsan)",
  9: "국화 (Gukhwa)",
  10: "단풍 (Danpung)",
  11: "오동 (Odong)",
  12: "비 (Bi)",
};

export const DEFAULT_TARGET_SCORE_2P = 7;
export const DEFAULT_TARGET_SCORE_3P = 3;

export const DEFAULT_TOTAL_DEALS = 12;

export const JUNK_THRESHOLD = 10;
export const ANIMAL_THRESHOLD = 5;
export const RIBBON_THRESHOLD = 5;

export const PI_BAK_THRESHOLD = 5;
export const MEOUNG_DDA_THRESHOLD = 7;

export const QUAD_WIN_CHIPS = 5;
export const TRIPLE_PPUK_CHIPS = 5;
export const FIRST_TURN_PPUK_CHIPS = 3;

export const GODORI_MONTHS: Month[] = [2, 4, 8];
export const HONG_DAN_MONTHS: Month[] = [1, 2, 3];
export const CHEONG_DAN_MONTHS: Month[] = [6, 9, 10];
export const CHO_DAN_MONTHS: Month[] = [4, 5, 7];

export const BRIGHT_MONTHS: Month[] = [1, 3, 8, 11, 12];
export const RAIN_MONTH: Month = 12;
