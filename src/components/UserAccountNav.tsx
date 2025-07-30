'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { User } from 'next-auth'

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    id: string
    username?: string | null
    userType: 'FREE' | 'PAID' | 'MENTOR'
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'MODERATOR' | null
  }
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {user.image ? (
          <img
            src={user.image}
            alt={user.username || user.name || 'User'}
            className='h-8 w-8 rounded-full object-cover border border-zinc-200'
            referrerPolicy='no-referrer'
          />
        ) : (
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 border border-zinc-200'>
            <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-white' align='end'>
        <div className='flex items-center justify-start gap-2 p-2'>
          <div className='flex items-center gap-2'>
            <span className='font-medium'>u/{user.username}</span>
            <span className={
              user.userType === 'PAID' 
                ? 'bg-yellow-400 text-white px-2 py-1 rounded text-xs' 
                : user.userType === 'MENTOR'
                ? 'bg-blue-600 text-white px-2 py-1 rounded text-xs'
                : 'bg-zinc-300 text-zinc-700 px-2 py-1 rounded text-xs'
            }>
              {user.userType === 'PAID' ? 'Paid' : user.userType === 'MENTOR' ? 'Mentor' : 'Free'}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/'>Feed</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/r/create'>Create Community</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/mentors'>Meet the Mentor</Link>
        </DropdownMenuItem>
        {user.role === 'ADMIN' && (
          <DropdownMenuItem asChild>
            <Link href='/admin/mentor-applications'>Admin Panel</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/settings'>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className='cursor-pointer'>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
