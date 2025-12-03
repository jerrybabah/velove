const GRAPHQL_ENDPOINT_V3 = 'https://v3.velog.io/graphql'
const GRAPHQL_ENDPOINT_V2 = 'https://v2.velog.io/graphql'

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

export type CurrentUser = {
  id: string,
  username: string,
  email: string,
  profile: {
    id: string,
    thumbnail: string | null,
    display_name: string,
    short_bio: string,
    profile_links: {
      url: string,
      email: string,
      github: string,
      twitter: string,
      facebook: string,
    },
  },
  userMeta: {
    id: string,
    email_notification: boolean,
    email_promotion: boolean,
  },
}

export type EditedPostDto = {
  id: string,
  title: string,
  tags: string[],
  body: string,
  short_description: string,
  is_markdown: boolean,
  is_private: boolean,
  is_temp: boolean,
  thumbnail: string | null,
  url_slug: string,
  updated_at: string,
  series: {
    id: string,
    name: string,
  } | null,
  user: {
    id: string,
  },
}

export type StatDto = {
  total: number,
  count_by_day: Array<{
    count: number,
    day: string, // ISO date string
  }>
}

export async function fetchPosts({ username, limit, cursor }: { username: string, limit: number, cursor?: string }): Promise<{ posts: Post[], nextCursor?: string }> {
  const res = await fetch(GRAPHQL_ENDPOINT_V3, {
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
    releasedAt: new Date(postDto.released_at).getTime(),
    updatedAt: new Date(postDto.updated_at).getTime(),
    commentsCount: postDto.comments_count,
    tags: postDto.tags,
    isPrivate: postDto.is_private,
    likes: postDto.likes,
  }))

  return { posts, nextCursor: posts.length === limit ? posts[posts.length - 1].id : undefined }
}

export async function fetchCurrentUsername(): Promise<string | null> {
  const res = await fetch(GRAPHQL_ENDPOINT_V3, {
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

export async function fetchEditedPost(id: string): Promise<Omit<Post, 'username' | 'profileThumbnail' | 'profileDisplayName' | 'releasedAt' | 'commentsCount' | 'likes'>> {
  const res = await fetch(GRAPHQL_ENDPOINT_V2, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      operationName: 'ReadPostForEdit',
      query: `
        query ReadPostForEdit($id: ID) {
          post(id: $id) {
            id
            title
            tags
            body
            short_description
            is_markdown
            is_private
            is_temp
            thumbnail
            url_slug
            updated_at
            series {
              id
              name
            }
            user {
              id
            }
          }
        } 
      `,
      variables: { id },
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch edited post: ${res.status} ${res.statusText}`)
  }

  const json = await res.json() as { data: { post: EditedPostDto } }
  const postDto = json.data.post

  return {
    id: postDto.id,
    title: postDto.title,
    shortDescription: postDto.short_description,
    thumbnail: postDto.thumbnail,
    urlSlug: postDto.url_slug,
    updatedAt: new Date(postDto.updated_at).getTime(),
    tags: postDto.tags,
    isPrivate: postDto.is_private,
  }
}

// INFO: day is in ISO date string
export async function fetchPostStat(id: string): Promise<{ total: number, countByDay: { [day: string]: number } }> {
  const res = await fetch(GRAPHQL_ENDPOINT_V2, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      operationName: 'GetStats',
      query: `
        query GetStats($post_id: ID!) {
          getStats(post_id: $post_id) {
            total
            count_by_day {
              count
              day
            }
          }
        }
      `,
      variables: { post_id: id },
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`)
  }

  const json = await res.json() as { data: { getStats: StatDto } }
  const statDto = json.data.getStats

  const countByDay: { [day: string]: number } = {}
  for (const entry of statDto.count_by_day) {
    countByDay[entry.day] = entry.count
  }

  return {
    total: statDto.total,
    countByDay,
  }
}
