import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import MentorDirectory from '@/components/MentorDirectory'
import { GraduationCap } from 'lucide-react'

export default async function MentorsPage() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Only allow PAID and MENTOR users to access this page
  if (session.user.userType !== 'PAID' && session.user.userType !== 'MENTOR') {
    redirect('/')
  }

  return (
    <div className='w-full max-w-7xl mx-auto px-4 py-8'>
      <div className='mb-6 text-center'>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-blue-300 bg-white">
            <GraduationCap className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className='text-4xl font-extrabold tracking-tight text-zinc-900'>
            Meet the Mentor
          </h1>
        </div>
        <p className='text-zinc-600 text-lg'>Connect with experienced mentors and get guidance for your journey.</p>
      </div>
      <MentorDirectory currentUser={session.user} />
    </div>
  )
} 