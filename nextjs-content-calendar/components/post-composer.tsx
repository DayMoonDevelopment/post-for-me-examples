"use client"

import { useState, useEffect, useRef } from "react"
import type { SocialAccount } from "post-for-me/resources/social-accounts"
import type { SocialPost } from "post-for-me/resources/social-posts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlatformIcon } from "@/components/platform-icon"
import { PLATFORMS, type Platform } from "@/lib/platforms"
import {
  createPost,
  updatePost,
  deletePost,
  getMediaUploadURL,
  getPostResults,
} from "@/lib/actions"
import { cn } from "@/lib/utils"
import type { SocialPostResult } from "post-for-me/resources/social-post-results"

interface PostComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: SocialAccount[]
  post: SocialPost | null
  defaultDate: Date | null
  onSaved: (post: SocialPost) => void
  onDeleted: (postId: string) => void
}

function formatDateForInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatTimeForInput(date: Date) {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export function PostComposer({
  open,
  onOpenChange,
  accounts,
  post,
  defaultDate,
  onSaved,
  onDeleted,
}: PostComposerProps) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [caption, setCaption] = useState("")
  const [youtubeTitle, setYoutubeTitle] = useState("")
  const [instagramPlacement, setInstagramPlacement] = useState<
    "timeline" | "reels" | "stories"
  >("timeline")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [isDraft, setIsDraft] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [postResults, setPostResults] = useState<SocialPostResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!post
  const isProcessed = post?.status === "processed"
  const isProcessing = post?.status === "processing"
  const isEditable = !isProcessed && !isProcessing

  useEffect(() => {
    if (!open) return

    if (post) {
      setSelectedAccountIds(post.social_accounts.map((a) => a.id))
      setCaption(post.caption)
      setIsDraft(post.status === "draft")
      setMediaFiles([])
      setMediaUrls(
        post.media?.map((m) => m.url) ?? []
      )

      if (post.scheduled_at) {
        const d = new Date(post.scheduled_at)
        setScheduleDate(formatDateForInput(d))
        setScheduleTime(formatTimeForInput(d))
      } else {
        setScheduleDate("")
        setScheduleTime("")
      }

      // Platform configs
      const ytConfig = post.platform_configurations?.youtube
      setYoutubeTitle(
        typeof ytConfig?.title === "string" ? ytConfig.title : ""
      )

      const igConfig = post.platform_configurations?.instagram
      setInstagramPlacement(
        (igConfig?.placement as "timeline" | "reels" | "stories") ?? "timeline"
      )

      // Load results for processed posts
      if (post.status === "processed") {
        getPostResults(post.id).then(setPostResults)
      } else {
        setPostResults([])
      }
    } else {
      setSelectedAccountIds([])
      setCaption("")
      setYoutubeTitle("")
      setInstagramPlacement("timeline")
      setIsDraft(false)
      setMediaFiles([])
      setMediaUrls([])
      setPostResults([])

      if (defaultDate) {
        setScheduleDate(formatDateForInput(defaultDate))
        setScheduleTime("09:00")
      } else {
        setScheduleDate("")
        setScheduleTime("")
      }
    }
  }, [open, post, defaultDate])

  const selectedPlatforms = accounts
    .filter((a) => selectedAccountIds.includes(a.id))
    .map((a) => a.platform as Platform)

  const hasYouTube = selectedPlatforms.includes("youtube")
  const hasInstagram = selectedPlatforms.includes("instagram")

  function toggleAccount(id: string) {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setMediaFiles((prev) => [...prev, ...files])
    e.target.value = ""
  }

  function removeMedia(index: number) {
    if (index < mediaUrls.length) {
      setMediaUrls((prev) => prev.filter((_, i) => i !== index))
    } else {
      const fileIndex = index - mediaUrls.length
      setMediaFiles((prev) => prev.filter((_, i) => i !== fileIndex))
    }
  }

  async function uploadFiles(): Promise<string[]> {
    const urls: string[] = [...mediaUrls]

    for (const file of mediaFiles) {
      const { media_url, upload_url } = await getMediaUploadURL()
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      urls.push(media_url)
    }

    return urls
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const uploadedMedia = await uploadFiles()

      const scheduledAt =
        scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : undefined

      const platformConfigurations: Record<string, unknown> = {}
      if (hasYouTube && youtubeTitle) {
        platformConfigurations.youtube = { title: youtubeTitle }
      }
      if (hasInstagram) {
        platformConfigurations.instagram = { placement: instagramPlacement }
      }

      const payload = {
        caption,
        social_accounts: selectedAccountIds,
        media: uploadedMedia.map((url) => ({ url })),
        scheduled_at: scheduledAt ?? null,
        isDraft: isDraft || undefined,
        platform_configurations:
          Object.keys(platformConfigurations).length > 0
            ? platformConfigurations
            : undefined,
      }

      let saved: SocialPost
      if (isEditing) {
        saved = await updatePost(post.id, payload)
      } else {
        saved = await createPost(payload)
      }

      onSaved(saved)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!post) return
    setDeleting(true)
    try {
      await deletePost(post.id)
      onDeleted(post.id)
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  const canSubmit =
    caption.trim().length > 0 && selectedAccountIds.length > 0 && !submitting

  function getSubmitLabel() {
    if (isDraft) return "Save Draft"
    if (scheduleDate && scheduleTime) return "Schedule Post"
    return "Post Now"
  }

  const allMedia = [
    ...mediaUrls.map((url) => ({ type: "url" as const, url })),
    ...mediaFiles.map((file) => ({
      type: "file" as const,
      url: URL.createObjectURL(file),
      name: file.name,
    })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Post" : "New Post"}
          </DialogTitle>
        </DialogHeader>

        {isProcessing && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            This post is currently being published. You cannot edit it while
            it&apos;s processing.
          </div>
        )}

        {isProcessed && postResults.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Post Results</p>
            {postResults.map((result) => {
              const account = post.social_accounts.find(
                (a) => a.id === result.social_account_id
              )
              const platform = account?.platform as Platform
              return (
                <div
                  key={result.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2 text-sm",
                    result.success
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  )}
                >
                  <PlatformIcon platform={platform} className="size-4" />
                  <span className="flex-1 font-medium">
                    {account?.username ?? platform}
                  </span>
                  {result.success ? (
                    result.platform_data?.url ? (
                      <a
                        href={result.platform_data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline dark:text-blue-400"
                      >
                        View post
                      </a>
                    ) : (
                      <span className="text-xs text-green-700 dark:text-green-400">
                        Published
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {String(result.error ?? "Failed")}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isEditable && (
          <div className="flex flex-col gap-4">
            {/* Account selection */}
            <div className="flex flex-col gap-2">
              <Label>Post To</Label>
              <div className="flex flex-col gap-1.5">
                {accounts.map((account) => {
                  const platform = account.platform as Platform
                  const config = PLATFORMS[platform]
                  if (!config) return null
                  const selected = selectedAccountIds.includes(account.id)

                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => toggleAccount(account.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                        selected
                          ? cn(config.borderColor, config.chipBg)
                          : "border-transparent hover:bg-muted"
                      )}
                    >
                      <Avatar className="size-8">
                        <AvatarImage
                          src={account.profile_photo_url ?? undefined}
                        />
                        <AvatarFallback
                          className={cn("text-white", config.color)}
                        >
                          <PlatformIcon
                            platform={platform}
                            className="size-3.5"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {account.username ?? config.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config.label}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {selected && (
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="size-3"
                          >
                            <path d="M3 8l3.5 3.5L13 5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
                {accounts.length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    No connected accounts. Connect an account from the sidebar
                    first.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Media */}
            <div className="flex flex-col gap-2">
              <Label>Media</Label>
              {allMedia.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allMedia.map((media, i) => (
                    <div
                      key={i}
                      className="group relative size-20 overflow-hidden rounded-lg border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={media.url}
                        alt=""
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Add Media
              </Button>
            </div>

            <Separator />

            {/* Caption */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="caption">Caption</Label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* YouTube Title */}
            {hasYouTube && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="youtube-title">YouTube Title</Label>
                <Input
                  id="youtube-title"
                  value={youtubeTitle}
                  onChange={(e) => setYoutubeTitle(e.target.value)}
                  placeholder="Enter video title for YouTube"
                />
              </div>
            )}

            {/* Instagram Placement */}
            {hasInstagram && (
              <div className="flex flex-col gap-2">
                <Label>Instagram Placement</Label>
                <div className="flex gap-2">
                  {(
                    ["timeline", "reels", "stories"] as const
                  ).map((placement) => (
                    <Button
                      key={placement}
                      type="button"
                      variant={
                        instagramPlacement === placement
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setInstagramPlacement(placement)}
                    >
                      {placement.charAt(0).toUpperCase() + placement.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Schedule */}
            <div className="flex flex-col gap-2">
              <Label>Schedule</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-32"
                />
                {(scheduleDate || scheduleTime) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setScheduleDate("")
                      setScheduleTime("")
                    }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-4"
                    >
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>

            {/* Draft toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="draft"
                checked={isDraft}
                onCheckedChange={(checked) => setIsDraft(checked === true)}
              />
              <Label htmlFor="draft" className="text-sm font-normal">
                Save as Draft
              </Label>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? "Saving..." : getSubmitLabel()}
              </Button>
            </div>
          </div>
        )}

        {/* Non-editable states just show close */}
        {!isEditable && (
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
