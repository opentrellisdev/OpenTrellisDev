import { CheckCircle2 } from 'lucide-react'

// Category display config
export const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    BUG_TECH: { label: 'Bug / Tech', emoji: '🐛', color: 'bg-red-100 text-red-700 border-red-200' },
    MARKETING: { label: 'Marketing', emoji: '📣', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    OPERATIONS: { label: 'Operations', emoji: '⚙️', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    LEGAL: { label: 'Legal', emoji: '⚖️', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    FUNDING: { label: 'Funding', emoji: '💰', color: 'bg-green-100 text-green-700 border-green-200' },
    HIRING: { label: 'Hiring', emoji: '👥', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    OTHER: { label: 'Other', emoji: '📝', color: 'bg-slate-100 text-slate-700 border-slate-200' },
}

export const STAGE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    IDEA: { label: 'Idea', emoji: '💡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    MVP: { label: 'MVP', emoji: '🚀', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    REVENUE: { label: 'Revenue', emoji: '💵', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    SCALING: { label: 'Scaling', emoji: '📈', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

interface CategoryBadgeProps {
    category: string
    size?: 'sm' | 'md'
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
    const config = CATEGORY_CONFIG[category]
    if (!config) return null

    const sizeClasses = size === 'sm'
        ? 'text-xs px-2 py-0.5'
        : 'text-sm px-2.5 py-1'

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses}`}>
            <span>{config.emoji}</span>
            <span>{config.label}</span>
        </span>
    )
}

interface StageBadgeProps {
    stage: string
    size?: 'sm' | 'md'
}

export function StageBadge({ stage, size = 'md' }: StageBadgeProps) {
    const config = STAGE_CONFIG[stage]
    if (!config) return null

    const sizeClasses = size === 'sm'
        ? 'text-xs px-2 py-0.5'
        : 'text-sm px-2.5 py-1'

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses}`}>
            <span>{config.emoji}</span>
            <span>{config.label}</span>
        </span>
    )
}

interface SolvedBadgeProps {
    size?: 'sm' | 'md'
}

export function SolvedBadge({ size = 'md' }: SolvedBadgeProps) {
    const sizeClasses = size === 'sm'
        ? 'text-xs px-2 py-0.5'
        : 'text-sm px-2.5 py-1'
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border font-medium bg-green-100 text-green-700 border-green-200 ${sizeClasses}`}>
            <CheckCircle2 className={iconSize} />
            <span>Solved</span>
        </span>
    )
}

interface PostTagsProps {
    category?: string | null
    stage?: string | null
    isSolved?: boolean
    size?: 'sm' | 'md'
}

export function PostTags({ category, stage, isSolved, size = 'md' }: PostTagsProps) {
    const hasAnyTag = category || stage || isSolved

    if (!hasAnyTag) return null

    return (
        <div className='flex flex-wrap items-center gap-2'>
            {isSolved && <SolvedBadge size={size} />}
            {category && <CategoryBadge category={category} size={size} />}
            {stage && <StageBadge stage={stage} size={size} />}
        </div>
    )
}
