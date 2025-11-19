const GRAPHQL_ENDPOINT = 'https://v3.velog.io/graphql'

export type PostDto = {
  id: string,
  title: string,
  short_description: string,
  thumbnail: string | null,
  user: {
    id: string,
    username: string,
    profile: {
      id: string,
      thumbnail: string | null,
      display_name: string,
    },
  },
  url_slug: string,
  released_at: string,
  updated_at: string,
  comments_count: number,
  tags: string[],
  is_private: boolean,
  likes: number,
}

export async function fetchPosts({ username, limit, cursor }: { username: string, limit: number, cursor?: string }): Promise<{ posts: Post[], nextCursor?: string }> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      query: `
        query velogPosts($input: GetPostsInput!) {
          posts(input: $input) {
            id
            title
            short_description
            thumbnail
            user {
              id
              username
              profile {
                id
                thumbnail
                display_name
              }
            }
            url_slug
            released_at
            updated_at
            comments_count
            tags
            is_private
            likes
          }
        }
      `,
      variables: {
        input: {
          cursor: cursor || '',
          username,
          limit,
          tag: '',
        },
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`)
  }

  const json = await res.json() as { data: { posts: PostDto[] } }
  const posts = json.data.posts.map((postDto) => ({
    id: postDto.id,
    title: postDto.title,
    shortDescription: postDto.short_description,
    thumbnail: postDto.thumbnail,
    username: postDto.user.username,
    profileThumbnail: postDto.user.profile.thumbnail,
    profileDisplayName: postDto.user.profile.display_name,
    urlSlug: postDto.url_slug,
    releasedAt: new Date(postDto.released_at),
    updatedAt: new Date(postDto.updated_at),
    commentsCount: postDto.comments_count,
    tags: postDto.tags,
    isPrivate: postDto.is_private,
    likes: postDto.likes,
  }))

  return { posts, nextCursor: posts.length === limit ? posts[posts.length - 1].id : undefined }
}

export type CurrentUser = {
  id: string,
  username: string,
  email: string,
  profile: {
    id: string,
    thumbnail: string | null,
    displayName: string,
    shortBio: string,
    profileLinks: {
      url: string,
      email: string,
      github: string,
      twitter: string,
      facebook: string,
    },
  },
  userMeta: {
    id: string,
    emailNotification: boolean,
    emailPromotion: boolean,
  },
}

export async function fetchCurrentUsername(): Promise<string | null> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      query: `
        query currentUser {
          currentUser {
            id
            username
            email
            profile {
              id
              thumbnail
              display_name
              short_bio
              profile_links
            }
            user_meta {
              id
              email_notification
              email_promotion
            }
          }
        }
      `,
      variables: {},
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status} ${res.statusText}`)
  }

  const json = await res.json() as { data: { currentUser: CurrentUser | null } }
  if (!json.data.currentUser) {
    return null
  }

  return json.data.currentUser.username
}
