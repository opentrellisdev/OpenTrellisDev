'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

interface DMModalProps {
  receiverId: string
  receiverUsername?: string | null
  onClose: () => void
}

export default function DMModal({ receiverId, receiverUsername, onClose }: DMModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const sendMessage = async () => {
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/messages', { receiverId, content: message })
      setSent(true)
    } catch (e) {
      setError('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30'>
      <div ref={modalRef} className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative'>
        <button
          className='absolute top-2 right-2 text-zinc-400 hover:text-zinc-700 text-xl font-bold rounded focus:outline-none'
          onClick={onClose}
          aria-label='Close'
        >
          ×
        </button>
        <h2 className='font-semibold text-lg mb-2'>Message u/{receiverUsername}</h2>
        {sent ? (
          <div className='text-green-600 mb-4'>Message sent!</div>
        ) : (
          <>
            <textarea
              className='w-full border rounded p-2 mb-2'
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='Type your message...'
              disabled={loading}
            />
            {error && <div className='text-red-600 text-sm mb-2'>{error}</div>}
            <div className='flex justify-end gap-2'>
              <button
                className='px-3 py-1 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className='px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white'
                onClick={sendMessage}
                disabled={loading || !message.trim()}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 