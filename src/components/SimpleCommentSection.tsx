'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/hooks/use-toast'
import { formatTimeToNow } from '@/lib/utils'
import axios from 'axios'

interface Comment {
  id: string
  text: string
  createdAt: string
  author: {
    username: string | null
    email: string | null
    userType: string
  }
}

interface SimpleCommentSectionProps {
  postId: string
}

export default function SimpleCommentSection({ postId }: SimpleCommentSectionProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(`/api/posts/${postId}/comments`)
        setComments(response.data)
      } catch (error) {
        console.error('Error fetching comments:', error)
        setComments([])
      } finally {
        setIsLoading(false)
      }
    }

    if (postId) {
      fetchComments()
    }
  }, [postId])

  // Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    if (!session) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to comment.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log('Submitting comment:', { postId, text: newComment })
      
      const response = await axios.patch('/api/subreddit/post/comment/', {
        postId,
        text: newComment,
      })

      if (response.status === 200) {
        toast({
          title: 'Success!',
          description: 'Your comment has been posted.',
        })
        setNewComment('')
        
        // Refresh comments
        const commentsResponse = await axios.get(`/api/posts/${postId}/comments`)
        setComments(commentsResponse.data)
        
        // Refresh the page to update comment count
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error)
      toast({
        title: 'Error',
        description: error.response?.data || 'Failed to post comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <hr className="border-gray-200" />
      
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Comments ({comments.length})
        </h3>

        {/* Comment Form */}
        <div className="mb-6">
          {status === 'loading' ? (
            <p className="text-gray-500">Loading...</p>
          ) : !session ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-2">Please sign in to comment</p>
              <Button onClick={() => window.location.href = '/sign-in'}>
                Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="What are your thoughts?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="w-full"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      comment.author.userType === 'MENTOR' ? 'text-blue-600' :
                      comment.author.userType === 'PAID' ? 'text-yellow-600' :
                      'text-gray-900'
                    }`}>
                      u/{comment.author.username || 'Anonymous'}
                    </span>
                    {comment.author.userType === 'MENTOR' && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        MENTOR
                      </span>
                    )}
                    {comment.author.userType === 'PAID' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        PAID
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimeToNow(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
