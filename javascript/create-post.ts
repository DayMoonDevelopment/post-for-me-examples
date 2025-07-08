type SocialPostMedia = {
  url: string;
};

type SocialPost = {
  caption: string; // caption that will be posted
  media?: SocialPostMedia[]; // media url's that will be posted. Must be publicly accessible
  social_accounts: string[]; // social accounts to post to (get from the `/v1/social-accounts` endpoint)
  external_id?: string; // an identifier that you can use for looking up the post later based on your own internal system
  platform_configurations?: {
    // platform specific configurations
    [platform: string]: {
      [key: string]: any;
    };
  };
  account_configurations?: {
    // account specific configurations
    social_account_id?: string;
    configuration: {
      [key: string]: any;
    };
  }[];
  scheduled_at?: string; // date and time to schedule the post. if `null`, the post will be posted immediately
};

// Example 1: Simple Post
// Create a simple post with default settings and no overrides
async function createSimplePost(apiKey: string): Promise<void> {
  const postData: SocialPost = {
    caption:
      "Just launched our new product! 🚀 Excited to share this with everyone.",
    social_accounts: [
      "sa_instagram-xyz",
      "sa_facebook-xyz",
      "sa_pinterest-xyz",
    ],
    external_id: "unique-post-id",
    media: [
      {
        url: "https://example.com/image.jpg",
      },
      {
        url: "https://example.com/video.mp4",
      },
    ],
  };

  const response = await fetch("https://api.postforme.dev/v1/social-posts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const {
    id, // id of the created post to use for lookup `/v1/social-posts/{id}`
    ...post // the post data from above
  } = await response.json();

  /**
   * sa_instagram-xyz
   * - caption: "Just launched our new product! 🚀 Excited to share this with everyone."
   * - media: https://example.com/image.jpg (if platform supports media type), https://example.com/video.mp4 (if platform supports media type)
   *
   * sa_facebook-xyz
   * - caption: "Just launched our new product! 🚀 Excited to share this with everyone."
   * - media: https://example.com/image.jpg (if platform supports media type), https://example.com/video.mp4 (if platform supports media type)
   *
   * sa_pinterest-xyz
   * - caption: "Just launched our new product! 🚀 Excited to share this with everyone."
   * - media: https://example.com/image.jpg (if platform supports media type), https://example.com/video.mp4 (if platform supports media type)
   */
}

// Example 2: Platform Configurations
// Create a simple post with default settings and platform-specific overrides
async function createPlatformSpecificPost(apiKey: string): Promise<void> {
  const postData: SocialPost = {
    caption:
      "Just launched our new product! 🚀 Excited to share this with everyone.",
    social_accounts: [
      "sa_instagram-xyz",
      "sa_facebook-xyz",
      "sa_pinterest-xyz",
    ],
    external_id: "unique-post-id",
    media: [
      {
        url: "https://example.com/image.jpg",
      },
    ],
    platform_configurations: {
      instagram: {
        caption: "Hi Instagram! Check out our new product! 🚀", // caption applied to all instagram accounts listed in the social_accounts field
      },
      facebook: {
        caption: "Hi Facebook! Check out our new product! 🚀", // caption applied to all facebook accounts listed in the social_accounts field
      },
      pinterest: {
        board_ids: ["pinterest-board-id"], // some platforms offer unique configurations which can be set for all accounts of that type listed in the social_accounts field
      },
    },
  };

  const response = await fetch("https://api.postforme.dev/v1/social-posts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const {
    id, // id of the created post to use for lookup `/v1/social-posts/{id}`
    ...post // the post data from above
  } = await response.json();

  /**
   * sa_instagram-xyz
   * - caption: "Hi Instagram! Check out our new product! 🚀"
   * - media: https://example.com/image.jpg (if platform supports media type)
   *
   * sa_facebook-xyz
   * - caption: "Hi Facebook! Check out our new product! 🚀"
   * - media: https://example.com/image.jpg (if platform supports media type)
   *
   * sa_pinterest-xyz
   * - caption: "Just launched our new product! 🚀 Excited to share this with everyone."
   * - media: https://example.com/image.jpg (if platform supports media type)
   * - board_ids: ["pinterest-board-id"]
   */
}

// Example 3: Account Overrides
// Create a simple post with default settings and account-specific overrides
async function createAccountSpecificPost(apiKey: string): Promise<void> {
  const postData: SocialPost = {
    caption:
      "Just launched our new product! 🚀 Excited to share this with everyone.",
    social_accounts: [
      "sa_instagram-xyz",
      "sa_instagram-abc",
      "sa_pinterest-xyz",
    ],
    external_id: "unique-post-id",
    media: [
      {
        url: "https://example.com/image-a.jpg",
      },
    ],
    platform_configurations: {
      instagram: {
        caption: "Hi Instagram! Check out our new product! 🚀", // caption applied to all instagram accounts listed in the social_accounts field
      },
    },
    account_configurations: [
      {
        social_account_id: "sa_instagram-xyz", // the social account id to override
        configuration: {
          caption: "Check out our new product! 🚀", // caption applied to the instagram account with id `sa_instagram-xyz`
        },
      },
      {
        social_account_id: "sa_pinterest-xyz", // the social account id to override
        configuration: {
          board_ids: ["pinterest-board-id"], // If this social account supports this configuration value, it will be applied
        },
      },
    ],
  };

  const response = await fetch("https://api.postforme.dev/v1/social-posts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const {
    id, // id of the created post to use for lookup `/v1/social-posts/{id}`
    ...post // the post data from above
  } = await response.json();

  /**
   * sa_instagram-xyz
   * - caption: "Check out our new product! 🚀"
   * - media: https://example.com/image.jpg (if platform supports media type)
   *
   * sa_instagram-abc
   * - caption: "Hi Instagram! Check out our new product! 🚀"
   * - media: https://example.com/image.jpg (if platform supports media type)
   *
   * sa_pinterest-xyz
   * - caption: "Just launched our new product! 🚀 Excited to share this with everyone."
   * - media: https://example.com/image.jpg (if platform supports media type)
   * - board_ids: ["pinterest-board-id"]
   */
}
