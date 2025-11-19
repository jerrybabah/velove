import { storage } from '#imports'

export type Post = {
  id: string,
  title: string,
  shortDescription: string,
  thumbnail: string | null,
  username: string,
  profileThumbnail: string | null,
  profileDisplayName: string,
  urlSlug: string,
  releasedAt: Date,
  updatedAt: Date,
  commentsCount: number,
  tags: string[],
  isPrivate: boolean,
  likes: number,
}

export const postsStorage = storage.defineItem<Post[], { cachedAt: number }>('local:posts')

export const currentUsernameStorage = storage.defineItem<string>('local:currentUsername')