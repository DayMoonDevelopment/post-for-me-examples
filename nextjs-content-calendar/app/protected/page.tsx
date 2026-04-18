import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAccounts, getPosts } from "@/lib/actions"
import { ContentCalendar } from "@/components/content-calendar"

export default async function ProtectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [accounts, posts] = await Promise.all([getAccounts(), getPosts()])

  return (
    <ContentCalendar
      initialAccounts={accounts}
      initialPosts={posts}
      userEmail={user.email ?? ""}
    />
  )
}
