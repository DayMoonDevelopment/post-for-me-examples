"use client"

import { useState, useCallback, useMemo } from "react"
import type { SocialAccount } from "post-for-me/resources/social-accounts"
import type { SocialPost } from "post-for-me/resources/social-posts"
import { Button } from "@/components/ui/button"
import { PlatformIcon } from "@/components/platform-icon"
import { AccountCard } from "@/components/account-card"
import { PostComposer } from "@/components/post-composer"
import { UserMenu } from "@/components/user-menu"
import { PLATFORMS, SUPPORTED_PLATFORMS, type Platform } from "@/lib/platforms"
import { cn } from "@/lib/utils"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days: { date: Date; isCurrentMonth: boolean }[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }

  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }
  }

  return days
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function PostChip({
  post,
  onClick,
}: {
  post: SocialPost
  onClick: () => void
}) {
  const platforms = post.social_accounts.map((a) => a.platform)
  const primaryPlatform = platforms[0] as Platform
  const config = PLATFORMS[primaryPlatform] ?? PLATFORMS.instagram

  const statusStyles = {
    draft: "opacity-60 border-dashed",
    scheduled: "border-solid",
    processing: "border-solid animate-pulse",
    processed: "border-solid",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-colors hover:brightness-95",
        config.chipBg,
        config.borderColor,
        statusStyles[post.status]
      )}
    >
      <PlatformIcon
        platform={primaryPlatform}
        className={cn("size-3 shrink-0", config.textColor)}
      />
      {platforms.length > 1 && (
        <span className="shrink-0 text-[10px] text-muted-foreground">
          +{platforms.length - 1}
        </span>
      )}
      <span className="truncate">{post.caption}</span>
    </button>
  )
}

export function ContentCalendar({
  initialAccounts,
  initialPosts,
  userEmail,
}: {
  initialAccounts: SocialAccount[]
  initialPosts: SocialPost[]
  userEmail: string
}) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [accounts, setAccounts] = useState(initialAccounts)
  const [posts, setPosts] = useState(initialPosts)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  )

  function navigateMonth(delta: number) {
    const d = new Date(currentYear, currentMonth + delta)
    setCurrentMonth(d.getMonth())
    setCurrentYear(d.getFullYear())
  }

  function goToToday() {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  function getPostsForDate(date: Date) {
    return posts.filter((post) => {
      const postDate = post.scheduled_at
        ? new Date(post.scheduled_at)
        : new Date(post.created_at)
      return isSameDay(postDate, date)
    })
  }

  function getAccountByPlatform(platform: string) {
    return (
      accounts.find(
        (a) => a.platform === platform && a.status === "connected"
      ) ?? null
    )
  }

  const connectedAccounts = accounts.filter((a) => a.status === "connected")

  const handleRefreshAccounts = useCallback(async () => {
    const { getAccounts } = await import("@/lib/actions")
    const updated = await getAccounts()
    setAccounts(updated)
  }, [])

  function handlePostSaved(post: SocialPost) {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === post.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = post
        return next
      }
      return [...prev, post]
    })
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  function openNewPost() {
    setEditingPost(null)
    setSelectedDate(null)
    setComposerOpen(true)
  }

  function openNewPostForDate(date: Date) {
    setEditingPost(null)
    setSelectedDate(date)
    setComposerOpen(true)
  }

  function openEditPost(post: SocialPost) {
    setEditingPost(post)
    setSelectedDate(null)
    setComposerOpen(true)
  }

  return (
    <div className="flex h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Content Calendar</h1>
        <UserMenu email={userEmail} />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-72 shrink-0 flex-col gap-4 border-r p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            My Accounts
          </h2>
          <div className="flex flex-col gap-2">
            {SUPPORTED_PLATFORMS.map((platform) => (
              <AccountCard
                key={platform}
                platform={platform}
                account={getAccountByPlatform(platform)}
                onDisconnected={handleRefreshAccounts}
              />
            ))}
          </div>
        </aside>

        {/* Calendar */}
        <main className="flex min-w-0 flex-1 flex-col p-4">
          {/* Calendar header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigateMonth(-1)}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                >
                  <path d="M10 4l-4 4 4 4" />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigateMonth(1)}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </Button>
              <h2 className="text-base font-medium">{monthLabel}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button size="sm" onClick={openNewPost}>
                + New Post
              </Button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid flex-1 auto-rows-fr grid-cols-7">
              {calendarDays.map(({ date, isCurrentMonth }, i) => {
                const dayPosts = getPostsForDate(date)
                const isToday = isSameDay(date, today)

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col gap-0.5 overflow-hidden border-b border-r p-1",
                      !isCurrentMonth && "bg-muted/30"
                    )}
                    onDoubleClick={() => openNewPostForDate(date)}
                  >
                    <span
                      className={cn(
                        "mb-0.5 self-end text-xs",
                        !isCurrentMonth && "text-muted-foreground/50",
                        isToday &&
                          "flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex flex-col gap-0.5 overflow-y-auto">
                      {dayPosts.slice(0, 3).map((post) => (
                        <PostChip
                          key={post.id}
                          post={post}
                          onClick={() => openEditPost(post)}
                        />
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{dayPosts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Post composer */}
      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        accounts={connectedAccounts}
        post={editingPost}
        defaultDate={selectedDate}
        onSaved={handlePostSaved}
        onDeleted={handlePostDeleted}
      />
    </div>
  )
}
