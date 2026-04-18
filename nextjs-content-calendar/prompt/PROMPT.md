Social Media Content Calendar

Build a social media content calendar app using Next.js, shadcn/ui, and Supabase for auth. The app lets users connect their Instagram, TikTok, and YouTube accounts, then compose, schedule, and track posts across all connected platforms from a single calendar interface. Social media posting and account management is handled by the Post for Me API (post-for-me npm package).

Attached are reference images showing the expected layout and UI structure. Use these as a guide for the overall page layout, component placement, and visual hierarchy.


CORE CONCEPTS

Authentication

Users sign in with email and password via Supabase. All app routes are protected -- unauthenticated users are redirected to a login page. The Supabase user ID is used as the external_id when connecting social accounts through Post for Me, tying each user's connected accounts to their auth session.


Post for Me Integration

Post for Me is a third-party API that handles OAuth flows for social platforms, stores account credentials, and publishes posts on the user's behalf. The app uses the post-for-me npm SDK server-side only -- API keys must never be exposed to the client. All SDK calls happen in server actions or server components.

Install the SDK with `npm install post-for-me` before using it in the app.

Review the SDK types in node_modules/post-for-me and the API docs at api.postforme.dev/docs to understand the available resources, request/response shapes, and supported platform configurations.


Data Flow

Post for Me is the source of truth for all post and account data -- do not replicate this data in our database. We use Supabase Auth solely for user identification. When connecting social accounts through Post for Me, the Supabase user ID is passed as the external_id. To fetch a user's accounts and posts, filter by that external_id to scope data to the authenticated user. Always verify the user's identity before creating, updating, or deleting posts.


FEATURE 1: ACCOUNT CONNECTION

The app supports exactly one account per platform: one Instagram, one TikTok, and one YouTube. The header area shows all three platforms and reflects whether each is connected or not.

Disconnected: Clicking initiates the OAuth flow -- the app generates an auth URL via Post for Me and redirects the user to the platform's login page. On successful auth, the user is redirected back and the account appears as connected.

Connected: The app pulls account information from Post for Me (username, profile photo) and displays it on the UI. Clicking a connected account opens a disconnect confirmation dialog that shows the account details and warns the user before disconnecting.

The header also includes a user menu showing the user's email and a logout option.

Each platform has a distinct color identity used throughout the app:

YouTube: red tones
Instagram: pink tones
TikTok: black tones


FEATURE 2: CALENDAR DISPLAY

A full monthly calendar grid showing the user's posts. Month navigation with previous/next arrows, a "Today" button, and an "Add Post" button.

Each day cell shows post chips -- small colored pills with the platform icon and truncated caption. Clicking a chip opens the post in the edit dialog. If a post targets multiple accounts, indicate that on the chip.

Post chips are styled differently based on status to visually distinguish drafts, scheduled posts, and published posts at a glance.


FEATURE 3: POST COMPOSER

The post composer is a dialog that handles both creating new posts and editing existing ones.

Fields:

Post To -- Multi-select of connected accounts. Only connected accounts appear.

Post Status -- The dialog adapts based on the post's status from Post for Me. If the post hasn't been sent yet (draft or scheduled), all fields are editable. If the post is currently being published, the dialog should inform the user that it's processing. If the post has been processed, the dialog displays per-account results fetched from the Post for Me API -- each account the post was distributed to has its own independent result showing success (with a link to the live post) or failure (with the error message).

Media -- A file picker for images and video. Multiple files supported. On submit, each file is uploaded via a two-step flow: request a signed upload URL from Post for Me, PUT the file to that URL, then include the resulting media URL in the post payload.

Caption -- A textarea for the post content. Maps to the Post for Me caption field. Required.

Platform-specific options -- These fields only appear when the relevant account is selected in "Post To":

YouTube Title -- YouTube videos require a title separate from the caption. Only shown when a YouTube account is selected.

Instagram Placement -- The user can choose to post to Stories, Feed, or Reels. Only shown when an Instagram account is selected.

Schedule -- Date and time pickers. Defaults to no schedule (post immediately). The user can set a date and time to schedule the post, or clear the schedule to post immediately.

Save as Draft -- A checkbox. Drafts still accept a scheduled date as a tentative date for calendar placement but won't be processed until the draft flag is removed.

In edit mode, a "Delete" button is available. The submit button reflects the current configuration: "Save Draft" if draft is checked, "Schedule Post" if a date/time is set, or "Post Now" if no schedule and no draft. Disabled while caption is empty or no accounts are selected.

Submit flow:

1. Upload any media files sequentially (get URL, PUT file, collect media URLs)
2. Build the post payload with caption, account IDs, media URLs, scheduled_at, isDraft, and platform configurations
3. Call the create post server action
4. Add the returned post to the calendar state and close the dialog
