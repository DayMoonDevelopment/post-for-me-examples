export const PLATFORMS = {
  instagram: {
    label: "Instagram",
    color: "bg-pink-500",
    textColor: "text-pink-600 dark:text-pink-400",
    chipBg: "bg-pink-100 dark:bg-pink-950",
    borderColor: "border-pink-300 dark:border-pink-800",
    ringColor: "ring-pink-500/30",
  },
  tiktok: {
    label: "TikTok",
    color: "bg-neutral-900 dark:bg-white",
    textColor: "text-neutral-900 dark:text-neutral-100",
    chipBg: "bg-neutral-100 dark:bg-neutral-800",
    borderColor: "border-neutral-300 dark:border-neutral-700",
    ringColor: "ring-neutral-500/30",
  },
  youtube: {
    label: "YouTube",
    color: "bg-red-600",
    textColor: "text-red-600 dark:text-red-400",
    chipBg: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-300 dark:border-red-800",
    ringColor: "ring-red-500/30",
  },
} as const

export type Platform = keyof typeof PLATFORMS

export const SUPPORTED_PLATFORMS: Platform[] = [
  "instagram",
  "tiktok",
  "youtube",
]
