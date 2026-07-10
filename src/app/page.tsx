import { requireSession } from '@/lib/better-auth/session'
import { HomeScreen } from '@/features/auth/components/home-screen'

export default async function Home() {
  const { user } = await requireSession()

  return <HomeScreen name={user.name} />
}
