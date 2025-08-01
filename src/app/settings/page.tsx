import { redirect } from 'next/navigation'

import { UserNameForm } from '@/components/UserNameForm'
import { authOptions, getAuthSession } from '@/lib/auth'
import UserTypeToggle from '@/components/UserTypeToggle'
import MentorStatusToggle from '@/components/MentorStatusToggle'

export const metadata = {
  title: 'Settings',
  description: 'Manage account and website settings.',
}

export default async function SettingsPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect(authOptions?.pages?.signIn || '/login')
  }

  return (
    <div className='max-w-4xl mx-auto py-12'>
      <div className='grid items-start gap-8'>
        <h1 className='font-bold text-3xl md:text-4xl'>Settings</h1>

        <div className='grid gap-10'>
          <UserNameForm
            user={{
              id: session.user.id,
              username: session.user.username || '',
              userType: session.user.userType || 'FREE',
            }}
          />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <UserTypeToggle
              userType={session.user.userType || 'FREE'}
              userId={session.user.id}
            />
            <MentorStatusToggle
              userType={session.user.userType || 'FREE'}
              userId={session.user.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
