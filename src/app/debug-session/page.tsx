'use client'

import { useSession } from 'next-auth/react'

export default function DebugSession() {
  const { data: session, status } = useSession()

  return (
    <div className='w-full max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-4'>Session Debug</h1>
      
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h2 className='text-lg font-semibold mb-4'>Session Status: {status}</h2>
        
        <pre className='bg-gray-100 p-4 rounded-lg overflow-auto text-sm'>
          {JSON.stringify(session, null, 2)}
        </pre>
        
        {session?.user && (
          <div className='mt-4 space-y-2'>
            <p><strong>User ID:</strong> {session.user.id}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Name:</strong> {session.user.name}</p>
            <p><strong>Username:</strong> {session.user.username}</p>
            <p><strong>User Type:</strong> {session.user.userType}</p>
            <p><strong>Role:</strong> {session.user.role}</p>
          </div>
        )}
      </div>
    </div>
  )
} 