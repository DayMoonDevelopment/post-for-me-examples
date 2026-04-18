"use client"

import { useState } from "react"
import type { SocialAccount } from "post-for-me/resources/social-accounts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlatformIcon } from "@/components/platform-icon"
import { PLATFORMS, type Platform } from "@/lib/platforms"
import { connectAccount, disconnectAccount } from "@/lib/actions"
import { cn } from "@/lib/utils"

export function AccountCard({
  platform,
  account,
  onDisconnected,
}: {
  platform: Platform
  account: SocialAccount | null
  onDisconnected: () => void
}) {
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [loading, setLoading] = useState(false)
  const config = PLATFORMS[platform]

  async function handleConnect() {
    setLoading(true)
    try {
      const url = await connectAccount(platform)
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!account) return
    setLoading(true)
    try {
      await disconnectAccount(account.id)
      setShowDisconnect(false)
      onDisconnected()
    } catch {
      setLoading(false)
    }
  }

  if (!account) {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors hover:bg-muted",
          config.borderColor
        )}
      >
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-white",
            config.color
          )}
        >
          <PlatformIcon platform={platform} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">
            {loading ? "Connecting..." : "Click to connect"}
          </p>
        </div>
        <span className="text-lg text-muted-foreground">+</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowDisconnect(true)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted",
          config.borderColor
        )}
      >
        <Avatar className="size-9">
          <AvatarImage src={account.profile_photo_url ?? undefined} />
          <AvatarFallback
            className={cn("text-white", config.color)}
          >
            <PlatformIcon platform={platform} className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {account.username ?? config.label}
          </p>
          <p className={cn("text-xs", config.textColor)}>Connected</p>
        </div>
      </button>

      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {config.label}?</DialogTitle>
            <DialogDescription>
              This will disconnect{" "}
              <span className="font-medium text-foreground">
                @{account.username}
              </span>{" "}
              from your account. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Avatar className="size-10">
              <AvatarImage src={account.profile_photo_url ?? undefined} />
              <AvatarFallback className={cn("text-white", config.color)}>
                <PlatformIcon platform={platform} className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {account.username ?? "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnect(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
