import { useApp } from './useApp'

export function App() {
  const { username } = useApp()

  return <div>{username || 'anonymous'}</div>
}