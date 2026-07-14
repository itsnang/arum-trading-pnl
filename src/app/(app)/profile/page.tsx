import { requireSession } from '@/lib/better-auth/session'
import { ProfileScreen } from '@/features/profile/components/profile-screen'

export default async function ProfilePage() {
  const { user } = await requireSession()

  return (
    <ProfileScreen
      user={{
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      }}
    />
  )
}
