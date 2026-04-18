"use server"

import { createClient } from "@/lib/supabase/server"
import { createPostForMeClient } from "@/lib/post-for-me"
import type { SocialPost, SocialPostCreateParams, SocialPostUpdateParams } from "post-for-me/resources/social-posts"

async function getAuthenticatedUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user.id
}

// ── Accounts ──

export async function getAccounts() {
  const userId = await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  const res = await pfm.socialAccounts.list({
    external_id: [userId],
    status: ["connected"],
  })
  return res.data
}

export async function connectAccount(platform: string) {
  const userId = await getAuthenticatedUserId()
  const pfm = createPostForMeClient()

  const platformData: Record<string, unknown> = {}
  if (platform === "instagram") {
    platformData.instagram = { connection_type: "instagram" as const }
  }

  const res = await pfm.socialAccounts.createAuthURL({
    platform,
    external_id: userId,
    permissions: ["posts", "feeds"],
    ...(Object.keys(platformData).length > 0
      ? { platform_data: platformData }
      : {}),
  })
  return res.url
}

export async function disconnectAccount(accountId: string) {
  await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  await pfm.socialAccounts.disconnect(accountId)
}

// ── Posts ──

export async function getPosts() {
  const userId = await getAuthenticatedUserId()
  const pfm = createPostForMeClient()

  const all: SocialPost[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await pfm.socialPosts.list({
      external_id: [userId],
      limit,
      offset,
    })
    all.push(...res.data)
    if (res.data.length < limit || all.length >= res.meta.total) break
    offset += limit
  }

  return all
}

export async function getPost(postId: string) {
  await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  return pfm.socialPosts.retrieve(postId)
}

export async function createPost(params: SocialPostCreateParams) {
  const userId = await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  return pfm.socialPosts.create({
    ...params,
    external_id: userId,
  })
}

export async function updatePost(
  postId: string,
  params: SocialPostUpdateParams
) {
  await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  return pfm.socialPosts.update(postId, params)
}

export async function deletePost(postId: string) {
  await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  return pfm.socialPosts.delete(postId)
}

// ── Media ──

export async function getMediaUploadURL() {
  await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  return pfm.media.createUploadURL()
}

// ── Post Results ──

export async function getPostResults(postId: string) {
  await getAuthenticatedUserId()
  const pfm = createPostForMeClient()
  const res = await pfm.socialPostResults.list({ post_id: [postId] })
  return res.data
}
