'use client'

import { Prisma, Subreddit } from '@prisma/client'
import axios from 'axios'
import debounce from 'lodash.debounce'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command'
import { useOnClickOutside } from '@/hooks/use-on-click-outside'
import { Users } from 'lucide-react'

interface SearchBarProps {}

const SearchBar: FC<SearchBarProps> = ({}) => {
  const [input, setInput] = useState<string>('')
  const [queryResults, setQueryResults] = useState<(Subreddit & {
    _count: Prisma.SubredditCountOutputType
  })[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [isFetched, setIsFetched] = useState(false)
  const pathname = usePathname()
  const commandRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useOnClickOutside(commandRef, () => {
    setInput('')
  })

  const searchCommunities = useCallback(async (searchTerm: string) => {
    if (!searchTerm) {
      setQueryResults([])
      setIsFetched(false)
      return
    }

    setIsFetching(true)
    try {
      console.log(`Searching for: "${searchTerm}"`)
      const { data } = await axios.get(`/api/search?q=${searchTerm}`)
      console.log(`Search results for "${searchTerm}":`, data)
      setQueryResults(data)
      setIsFetched(true)
    } catch (error) {
      console.error('Search error:', error)
      setQueryResults([])
    } finally {
      setIsFetching(false)
    }
  }, [])

  const request = debounce(async (searchTerm: string) => {
    await searchCommunities(searchTerm)
  }, 300)

  const debounceRequest = useCallback((searchTerm: string) => {
    request(searchTerm)
  }, [request])

  useEffect(() => {
    setInput('')
  }, [pathname])

  return (
    <Command
      ref={commandRef}
      className='relative rounded-lg border max-w-lg z-50 overflow-visible'>
      <CommandInput
        isLoading={isFetching}
        onValueChange={(text) => {
          setInput(text)
          debounceRequest(text)
        }}
        value={input}
        className='outline-none border-none focus:border-none focus:outline-none ring-0'
        placeholder='Search communities...'
      />

      {input.length > 0 && (
        <CommandList className='absolute bg-white top-full inset-x-0 shadow rounded-b-md'>
          {isFetched && queryResults.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
          {queryResults.length > 0 ? (
            <CommandGroup heading='Communities'>
              {queryResults.map((subreddit) => (
                <CommandItem
                  onSelect={(e) => {
                    router.push(`/r/${e}`)
                    router.refresh()
                  }}
                  key={subreddit.id}
                  value={subreddit.name}>
                  <Users className='mr-2 h-4 w-4' />
                  <a href={`/r/${subreddit.name}`}>r/{subreddit.name}</a>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      )}
    </Command>
  )
}

export default SearchBar
