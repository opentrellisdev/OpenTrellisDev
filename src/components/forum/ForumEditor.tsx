'use client'

import EditorJS from '@editorjs/editorjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import { z } from 'zod'

import { toast } from '@/hooks/use-toast'
import { uploadFiles } from '@/lib/uploadthing'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import '@/styles/editor.css'
import { ImagePlus, BarChart2, X, Plus } from 'lucide-react'

// Categories for the General Forum
const CATEGORIES = [
    { value: 'BUG_TECH', label: 'Bug / Tech' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'OPERATIONS', label: 'Operations' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'FUNDING', label: 'Funding' },
    { value: 'HIRING', label: 'Hiring' },
    { value: 'OTHER', label: 'Other' },
] as const

// Business stages
const STAGES = [
    { value: 'IDEA', label: 'Idea Stage' },
    { value: 'MVP', label: 'MVP' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'SCALING', label: 'Scaling' },
] as const

// Form validation schema
const ForumPostValidator = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(128, 'Title must be less than 128 characters'),
    subredditId: z.string(),
    content: z.any(),
    category: z.string().optional(),
    businessStage: z.string().optional(),
    pollQuestion: z.string().optional(),
    pollOptions: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof ForumPostValidator>

interface ForumEditorProps {
    subredditId: string
}

export const ForumEditor: React.FC<ForumEditorProps> = ({ subredditId }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<FormData>({
        resolver: zodResolver(ForumPostValidator),
        defaultValues: {
            subredditId,
            title: '',
            content: null,
            category: undefined,
            businessStage: undefined,
            pollQuestion: '',
            pollOptions: ['', ''],
        },
    })

    const ref = useRef<EditorJS>()
    const _titleRef = useRef<HTMLTextAreaElement>(null)
    const router = useRouter()
    const [isMounted, setIsMounted] = useState<boolean>(false)
    const pathname = usePathname()
    const [showPoll, setShowPoll] = useState(false)
    const [pollOptions, setPollOptions] = useState<string[]>(['', ''])

    const { mutate: createPost, isPending } = useMutation({
        mutationFn: async (payload: FormData) => {
            const { data } = await axios.post('/api/subreddit/post/forum-create', payload)
            return data
        },
        onError: () => {
            return toast({
                title: 'Something went wrong.',
                description: 'Your post was not published. Please try again.',
                variant: 'destructive',
            })
        },
        onSuccess: () => {
            const newPathname = pathname.split('/').slice(0, -1).join('/')
            router.push(newPathname)
            router.refresh()

            return toast({
                description: 'Your post has been published.',
            })
        },
    })

    const initializeEditor = useCallback(async () => {
        const EditorJS = (await import('@editorjs/editorjs')).default
        const Header = (await import('@editorjs/header')).default
        const Embed = (await import('@editorjs/embed')).default
        const Table = (await import('@editorjs/table')).default
        const List = (await import('@editorjs/list')).default
        const Code = (await import('@editorjs/code')).default
        const LinkTool = (await import('@editorjs/link')).default
        const InlineCode = (await import('@editorjs/inline-code')).default
        const ImageTool = (await import('@editorjs/image')).default

        if (!ref.current) {
            const editor = new EditorJS({
                holder: 'forum-editor',
                onReady() {
                    ref.current = editor
                },
                placeholder: 'Describe your question or issue in detail. Include any relevant context about your business...',
                inlineToolbar: true,
                data: { blocks: [] },
                tools: {
                    header: Header,
                    linkTool: {
                        class: LinkTool,
                        config: {
                            endpoint: '/api/link',
                        },
                    },
                    image: {
                        class: ImageTool,
                        config: {
                            uploader: {
                                async uploadByFile(file: File) {
                                    const [res] = await uploadFiles('imageUploader', { files: [file] })
                                    return {
                                        success: 1,
                                        file: {
                                            url: res.url,
                                        },
                                    }
                                },
                            },
                        },
                    },
                    list: List,
                    code: Code,
                    inlineCode: InlineCode,
                    table: Table,
                    embed: Embed,
                },
            })
        }
    }, [])

    useEffect(() => {
        if (Object.keys(errors).length) {
            for (const [_key, value] of Object.entries(errors)) {
                toast({
                    title: 'Something went wrong.',
                    description: (value as { message: string }).message,
                    variant: 'destructive',
                })
            }
        }
    }, [errors])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsMounted(true)
        }
    }, [])

    useEffect(() => {
        const init = async () => {
            await initializeEditor()
            setTimeout(() => {
                _titleRef?.current?.focus()
            }, 0)
        }

        if (isMounted) {
            init()
            return () => {
                ref.current?.destroy()
                ref.current = undefined
            }
        }
    }, [isMounted, initializeEditor])

    const addPollOption = () => {
        if (pollOptions.length < 6) {
            setPollOptions([...pollOptions, ''])
        }
    }

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index))
        }
    }

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions]
        newOptions[index] = value
        setPollOptions(newOptions)
    }

    async function onSubmit(data: FormData) {
        const blocks = await ref.current?.save()

        const payload: FormData = {
            title: data.title,
            content: blocks,
            subredditId,
            category: data.category,
            businessStage: data.businessStage,
            pollQuestion: showPoll ? data.pollQuestion : undefined,
            pollOptions: showPoll ? pollOptions.filter(opt => opt.trim() !== '') : undefined,
        }

        createPost(payload)
    }

    if (!isMounted) {
        return null
    }

    const { ref: titleRef, ...rest } = register('title')

    return (
        <div className='w-full'>
            <form
                id='forum-post-form'
                className='space-y-6'
                onSubmit={handleSubmit(onSubmit)}>

                {/* Category & Stage Selection */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>Category *</label>
                        <select
                            {...register('category')}
                            className='w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer'
                        >
                            <option value=''>Select a category...</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>Business Stage</label>
                        <select
                            {...register('businessStage')}
                            className='w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer'
                        >
                            <option value=''>Select your stage...</option>
                            {STAGES.map((stage) => (
                                <option key={stage.value} value={stage.value}>
                                    {stage.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Title */}
                <div className='p-4 bg-zinc-50 rounded-lg border border-zinc-200'>
                    <div className='prose prose-stone dark:prose-invert w-full'>
                        <TextareaAutosize
                            ref={(e) => {
                                titleRef(e)
                                // @ts-ignore
                                _titleRef.current = e
                            }}
                            {...rest}
                            placeholder='Title - What do you need help with?'
                            className='w-full resize-none appearance-none overflow-hidden bg-transparent text-3xl font-bold focus:outline-none'
                        />
                        <div id='forum-editor' className='min-h-[300px]' />
                    </div>
                </div>

                {/* Image Upload Hint */}
                <div className='flex items-center gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg'>
                    <ImagePlus className='h-5 w-5 text-blue-500' />
                    <span>
                        <strong>Tip:</strong> Press <kbd className='px-1.5 py-0.5 bg-white border rounded text-xs'>Tab</kbd> in the editor to add images, links, code blocks, and more!
                    </span>
                </div>

                {/* Poll Section */}
                <div className='border border-gray-200 rounded-lg overflow-hidden'>
                    <button
                        type='button'
                        onClick={() => setShowPoll(!showPoll)}
                        className='w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center gap-2 text-left transition-colors'
                    >
                        <BarChart2 className={`h-5 w-5 transition-colors ${showPoll ? 'text-emerald-600' : 'text-gray-500'}`} />
                        <span className='font-medium'>Add a Poll</span>
                        <span className='text-gray-400 text-sm'>(optional)</span>
                    </button>

                    {showPoll && (
                        <div className='p-4 space-y-4 border-t'>
                            <input
                                {...register('pollQuestion')}
                                type='text'
                                placeholder='Poll question...'
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                            />

                            <div className='space-y-2'>
                                {pollOptions.map((option, index) => (
                                    <div key={index} className='flex gap-2'>
                                        <input
                                            type='text'
                                            value={option}
                                            onChange={(e) => updatePollOption(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                        />
                                        {pollOptions.length > 2 && (
                                            <button
                                                type='button'
                                                onClick={() => removePollOption(index)}
                                                className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                                            >
                                                <X className='h-5 w-5' />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {pollOptions.length < 6 && (
                                <button
                                    type='button'
                                    onClick={addPollOption}
                                    className='flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium'
                                >
                                    <Plus className='h-4 w-4' />
                                    Add Option
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type='submit'
                    disabled={isPending}
                    className='w-full py-3 px-4 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                    {isPending ? 'Posting...' : 'Post Question'}
                </button>
            </form>
        </div>
    )
}
