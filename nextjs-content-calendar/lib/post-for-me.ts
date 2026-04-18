import PostForMe from "post-for-me"

export function createPostForMeClient() {
  return new PostForMe({
    apiKey: process.env.POST_FOR_ME_API_KEY!,
  })
}
