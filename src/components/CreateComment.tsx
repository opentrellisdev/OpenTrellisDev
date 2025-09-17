'use client'

import { Button } from '@/components/ui/Button'
import { toast } from '@/hooks/use-toast'
import { CommentRequest } from '@/lib/validators/comment'

import { useCustomToasts } from '@/hooks/use-custom-toasts'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import { FC, useState } from 'react'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { useSession } from 'next-auth/react'

interface CreateCommentProps {
  postId: string
  replyToId?: string
}

const CreateComment: FC<CreateCommentProps> = ({ postId, replyToId }) => {
  const [input, setInput] = useState<string>('')
  const router = useRouter()
  const { loginToast } = useCustomToasts()
  const { data: session, status } = useSession()

  const { mutate: comment, isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      console.log('Creating comment:', { postId, text, replyToId })
      const payload: CommentRequest = { postId, text, replyToId }

      const { data } = await axios.patch(
        `/api/subreddit/post/comment/`,
        payload
      )
      return data
    },

    onError: (err) => {
      console.error('Comment creation error:', err)
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast()
        }
        console.error('API Error:', err.response?.data)
      }

      return toast({
        title: 'Something went wrong.',
        description: "Comment wasn't created successfully. Please try again.",
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      console.log('Comment created successfully')
      toast({
        title: 'Success!',
        description: 'Your comment has been posted.',
      })
      router.refresh()
      setInput('')
    },
  })

  if (status === 'loading') {
    return (
      <div className='grid w-full gap-1.5'>
        <p className='text-sm text-gray-500'>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className='grid w-full gap-1.5'>
        <p className='text-sm text-gray-500'>
          Please <button onClick={() => router.push('/sign-in')} className='text-blue-600 underline'>sign in</button> to comment.
        </p>
      </div>
    )
  }

  return (
    <div className='grid w-full gap-1.5'>
      <Label htmlFor='comment'>Your comment</Label>
      <div className='mt-2'>
        <Textarea
          id='comment'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder='What are your thoughts?'
        />

        <div className='mt-2 flex justify-end'>
          <Button
            isLoading={isLoading}
            disabled={input.length === 0}
            onClick={() => comment({ postId, text: input, replyToId })}>
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateComment
