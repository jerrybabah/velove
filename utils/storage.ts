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
  releasedAt: number,
  updatedAt: number,
  commentsCount: number,
  tags: string[],
  isPrivate: boolean,
  likes: number,
  viewStat?: {
    views: number,
    viewsByDay: { [day: string]: number }, // INFO: day is in ISO date string
  }
}

export const postsStorage = storage.defineItem<Post[], { cachedAt: number }>('local:posts')

export const currentUsernameStorage = storage.defineItem<string>('local:currentUsername')

export const themeStorage = storage.defineItem<'light' | 'dark'>('local:theme')