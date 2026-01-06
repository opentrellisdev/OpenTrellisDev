import PrivateMessagesSidebar from '@/components/PrivateMessagesSidebar'
import MeetTheMentorSidebar from '@/components/MeetTheMentorSidebar'
import { buttonVariants } from '@/components/ui/Button'
import { getAuthSession } from '@/lib/auth'
import Link from 'next/link'
import { Home as HomeIcon, ArrowRight, MessageCircle } from 'lucide-react'
import CustomFeed from '@/components/homepage/CustomFeed'
import GeneralFeed from '@/components/homepage/GeneralFeed'
import EnsureSubscription from '@/components/EnsureSubscription'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function Home() {
  const session = await getAuthSession()
  return (
    <div className='w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 px-4'>
      <EnsureSubscription />
      <div className='flex-1 min-w-0'>
        <h1 className='font-bold text-3xl md:text-4xl mb-6'>Your feed</h1>
        {session?.user?.role === 'ADMIN' && (
          <div className='mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg'>
            <p className='text-sm text-purple-800'>
              👑 Admin Mode: You can review mentor applications at{' '}
              <a href='/admin/mentor-applications' className='underline font-medium'>
                /admin/mentor-applications
              </a>
            </p>
          </div>
        )}
        {/* @ts-expect-error server component */}
        {session ? <CustomFeed /> : <GeneralFeed />}
      </div>
      <div className='w-full md:w-[340px] flex-shrink-0 space-y-4'>
        {/* Sidebar: Home card and Private Messages */}
        <div className='overflow-hidden h-fit rounded-lg border border-gray-200 order-first md:order-last'>
          <div className='bg-emerald-100 px-6 py-4'>
            <p className='font-semibold py-3 flex items-center gap-1.5'>
              <HomeIcon className='h-4 w-4' />
              Home
            </p>
          </div>
          <dl className='-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6'>
            <div className='flex justify-between gap-x-4 py-3'>
              <p className='text-zinc-500'>
                Your personal Open Trellis frontpage. Come here to check in with your
                favorite communities.
              </p>
            </div>
            <Link
              className={buttonVariants({
                variant: 'outline',
                className: 'w-full mt-4 group transition-all duration-200 border-2 border-zinc-900 hover:bg-zinc-100',
              })}
              href={`/r/general-forum`}>
              <span className='flex items-center justify-center gap-2'>
                <MessageCircle className='h-4 w-4' />
                General Forum
                <ArrowRight className='h-4 w-4 transition-all duration-200 group-hover:translate-x-2 group-hover:w-5' />
              </span>
            </Link>
            <Link
              className={buttonVariants({
                className: 'w-full mt-4 mb-6 group transition-all duration-200',
              })}
              href={`/r/create`}>
              <span className='flex items-center justify-center gap-2'>
                Create Community
                <ArrowRight className='h-4 w-4 transition-all duration-200 group-hover:translate-x-2 group-hover:w-5' />
              </span>
            </Link>
          </dl>
        </div>
        <MeetTheMentorSidebar />
        {(session?.user?.userType === 'PAID' || session?.user?.userType === 'MENTOR') && <PrivateMessagesSidebar />}
      </div>
    </div>
  )
}
