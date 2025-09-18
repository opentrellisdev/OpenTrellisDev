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
        console.error('SimpleCommentSection: Error fetching comments:', error)
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
      {/* Comment Form */}
      <div className="border-b border-gray-200 pb-6">
        {status === 'loading' ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        ) : !session ? (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-blue-800 mb-3">Please sign in to comment</p>
            <Button 
              onClick={() => window.location.href = '/sign-in'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="What are your thoughts?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="w-full resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">No comments yet</p>
            <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${
                    comment.author.userType === 'MENTOR' ? 'text-blue-600' :
                    comment.author.userType === 'PAID' ? 'text-yellow-600' :
                    'text-gray-900'
                  }`}>
                    u/{comment.author.username || 'Anonymous'}
                  </span>
                  {comment.author.userType === 'MENTOR' && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      MENTOR
                    </span>
                  )}
                  {comment.author.userType === 'PAID' && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                      PAID
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimeToNow(new Date(comment.createdAt))}
                </span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
